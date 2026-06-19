package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/shuwo/server/internal/config"
	"github.com/shuwo/server/internal/database"
	"github.com/shuwo/server/internal/middleware"
	"github.com/shuwo/server/internal/models"
)

type ReviewRequest struct {
	OrderID uint   `json:"orderId" binding:"required"`
	BookID  uint   `json:"bookId" binding:"required"`
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Content string `json:"content"`
}

func CreateReview(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "参数错误: "+err.Error()))
		return
	}

	var order models.Order
	if err := database.DB.First(&order, req.OrderID).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "订单不存在"))
		return
	}

	if order.BuyerID != userID {
		c.JSON(http.StatusForbidden, config.Error(403, "无权限评价此订单"))
		return
	}

	if order.Status != "completed" {
		c.JSON(http.StatusBadRequest, config.Error(400, "订单未完成，暂不能评价"))
		return
	}

	var existingReview models.Review
	result := database.DB.Where("order_id = ? AND user_id = ?", req.OrderID, userID).First(&existingReview)
	if result.Error == nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "您已评价过此订单"))
		return
	}

	tx := database.DB.Begin()

	review := models.Review{
		OrderID: req.OrderID,
		BookID:  req.BookID,
		UserID:  userID,
		Rating:  req.Rating,
		Content: req.Content,
	}

	if err := tx.Create(&review).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, config.Error(500, "创建评价失败: "+err.Error()))
		return
	}

	order.Status = "done"
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, config.Error(500, "更新订单状态失败"))
		return
	}

	tx.Commit()

	database.DB.Preload("User").Preload("Book").First(&review, review.ID)

	c.JSON(http.StatusOK, config.Success(review))
}

func GetReviews(c *gin.Context) {
	userIDStr := c.Query("userId")

	query := database.DB.Model(&models.Review{})

	if userIDStr != "" {
		userID, _ := strconv.Atoi(userIDStr)
		if userID > 0 {
			query = query.Where("user_id = ?", userID)
		}
	}

	var reviews []models.Review
	if err := query.Preload("User").Preload("Book").
		Order("created_at DESC").
		Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "获取评价列表失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(reviews))
}
