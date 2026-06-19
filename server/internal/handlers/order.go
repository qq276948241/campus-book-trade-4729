package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/shuwo/server/internal/config"
	"github.com/shuwo/server/internal/database"
	"github.com/shuwo/server/internal/middleware"
	"github.com/shuwo/server/internal/models"
)

type OrderRequest struct {
	BookID   uint   `json:"bookId" binding:"required"`
	Address  string `json:"address" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
	Receiver string `json:"receiver" binding:"required"`
}

type ShipRequest struct {
	LogisticsNo string `json:"logisticsNo" binding:"required"`
}

func generateOrderNo() string {
	return fmt.Sprintf("ORD%d%s", time.Now().Unix(), strconv.Itoa(time.Now().Nanosecond())[:6])
}

func CreateOrder(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req OrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "参数错误: "+err.Error()))
		return
	}

	var book models.Book
	if err := database.DB.First(&book, req.BookID).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "书籍不存在"))
		return
	}

	if book.Status != "available" {
		c.JSON(http.StatusBadRequest, config.Error(400, "书籍已售出或下架"))
		return
	}

	if book.SellerID == userID {
		c.JSON(http.StatusBadRequest, config.Error(400, "不能购买自己发布的书籍"))
		return
	}

	tx := database.DB.Begin()

	book.Status = "sold"
	if err := tx.Save(&book).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, config.Error(500, "更新书籍状态失败"))
		return
	}

	order := models.Order{
		OrderNo:  generateOrderNo(),
		BookID:   req.BookID,
		BuyerID:  userID,
		SellerID: book.SellerID,
		Price:    book.Price,
		Status:   "pending",
		Address:  req.Address,
		Phone:    req.Phone,
		Receiver: req.Receiver,
	}

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, config.Error(500, "创建订单失败: "+err.Error()))
		return
	}

	tx.Commit()

	database.DB.Preload("Book").Preload("Buyer").Preload("Seller").First(&order, order.ID)

	c.JSON(http.StatusOK, config.Success(order))
}

func GetOrders(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var orders []models.Order
	if err := database.DB.Where("buyer_id = ? OR seller_id = ?", userID, userID).
		Preload("Book").Preload("Buyer").Preload("Seller").
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "获取订单列表失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(orders))
}

func GetOrder(c *gin.Context) {
	userID := middleware.GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "无效的订单ID"))
		return
	}

	var order models.Order
	if err := database.DB.Preload("Book").Preload("Buyer").Preload("Seller").
		First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "订单不存在"))
		return
	}

	if order.BuyerID != userID && order.SellerID != userID {
		c.JSON(http.StatusForbidden, config.Error(403, "无权限查看此订单"))
		return
	}

	var logistics []models.Logistics
	database.DB.Where("order_id = ?", order.ID).Order("time DESC").Find(&logistics)

	c.JSON(http.StatusOK, config.Success(gin.H{
		"order":     order,
		"logistics": logistics,
	}))
}

func ShipOrder(c *gin.Context) {
	userID := middleware.GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "无效的订单ID"))
		return
	}

	var order models.Order
	if err := database.DB.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "订单不存在"))
		return
	}

	if order.SellerID != userID {
		c.JSON(http.StatusForbidden, config.Error(403, "无权限操作此订单"))
		return
	}

	if order.Status != "pending" {
		c.JSON(http.StatusBadRequest, config.Error(400, "订单状态不允许发货"))
		return
	}

	var req ShipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "参数错误: "+err.Error()))
		return
	}

	tx := database.DB.Begin()

	order.Status = "shipping"
	order.LogisticsNo = req.LogisticsNo
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, config.Error(500, "更新订单状态失败"))
		return
	}

	now := time.Now()
	logisticsRecords := []models.Logistics{
		{
			OrderID:     order.ID,
			LogisticsNo: req.LogisticsNo,
			Status:      "已发货",
			Location:    "发货地",
			Description: "商家已发货，正在等待快递员揽收",
			Time:        now,
		},
		{
			OrderID:     order.ID,
			LogisticsNo: req.LogisticsNo,
			Status:      "运输中",
			Location:    "转运中心",
			Description: "快递已到达转运中心，正在分拣中",
			Time:        now.Add(6 * time.Hour),
		},
		{
			OrderID:     order.ID,
			LogisticsNo: req.LogisticsNo,
			Status:      "派送中",
			Location:    "目的地城市",
			Description: "快递员正在派送中，请保持电话畅通",
			Time:        now.Add(24 * time.Hour),
		},
	}

	for _, record := range logisticsRecords {
		if err := tx.Create(&record).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, config.Error(500, "创建物流记录失败"))
			return
		}
	}

	tx.Commit()

	database.DB.Preload("Book").Preload("Buyer").Preload("Seller").First(&order, order.ID)

	c.JSON(http.StatusOK, config.Success(order))
}

func ConfirmOrder(c *gin.Context) {
	userID := middleware.GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "无效的订单ID"))
		return
	}

	var order models.Order
	if err := database.DB.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "订单不存在"))
		return
	}

	if order.BuyerID != userID {
		c.JSON(http.StatusForbidden, config.Error(403, "无权限操作此订单"))
		return
	}

	if order.Status != "shipping" {
		c.JSON(http.StatusBadRequest, config.Error(400, "订单状态不允许确认收货"))
		return
	}

	order.Status = "completed"
	if err := database.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "更新订单状态失败"))
		return
	}

	database.DB.Preload("Book").Preload("Buyer").Preload("Seller").First(&order, order.ID)

	c.JSON(http.StatusOK, config.Success(order))
}
