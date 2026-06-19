package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/shuwo/server/internal/config"
	"github.com/shuwo/server/internal/database"
	"github.com/shuwo/server/internal/middleware"
	"github.com/shuwo/server/internal/models"
)

func GetMyBooks(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var books []models.Book
	if err := database.DB.Where("seller_id = ?", userID).
		Preload("Tag").
		Order("created_at DESC").
		Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "获取我的书籍失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(books))
}

func GetMyOrders(c *gin.Context) {
	userID := middleware.GetUserID(c)
	orderType := c.DefaultQuery("type", "buy")

	query := database.DB.Model(&models.Order{})

	if orderType == "buy" {
		query = query.Where("buyer_id = ?", userID)
	} else if orderType == "sell" {
		query = query.Where("seller_id = ?", userID)
	} else {
		query = query.Where("buyer_id = ? OR seller_id = ?", userID, userID)
	}

	var orders []models.Order
	if err := query.Preload("Book").Preload("Buyer").Preload("Seller").
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "获取我的订单失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(orders))
}

func GetMyReviews(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var reviews []models.Review
	if err := database.DB.Where("user_id = ?", userID).
		Preload("Book").
		Order("created_at DESC").
		Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "获取我的评价失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(reviews))
}
