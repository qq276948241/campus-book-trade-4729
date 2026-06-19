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

type BookRequest struct {
	Title         string  `json:"title" binding:"required"`
	Author        string  `json:"author"`
	ISBN          string  `json:"isbn"`
	Price         float64 `json:"price" binding:"required,min=0"`
	OriginalPrice float64 `json:"originalPrice"`
	Description   string  `json:"description"`
	Condition     string  `json:"condition"`
	Image         string  `json:"image"`
	Images        string  `json:"images"`
	TagID         uint    `json:"tagId"`
}

func GetBooks(c *gin.Context) {
	tag := c.Query("tag")
	keyword := c.Query("keyword")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize := 10

	if page < 1 {
		page = 1
	}

	query := database.DB.Model(&models.Book{}).Where("status = ?", "available")

	if tag != "" {
		tagID, _ := strconv.Atoi(tag)
		if tagID > 0 {
			query = query.Where("tag_id = ?", tagID)
		} else {
			var bookTag models.BookTag
			if err := database.DB.Where("name = ?", tag).First(&bookTag).Error; err == nil {
				query = query.Where("tag_id = ?", bookTag.ID)
			}
		}
	}

	if keyword != "" {
		query = query.Where("title LIKE ? OR author LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var books []models.Book
	offset := (page - 1) * pageSize
	if err := query.Preload("Tag").Preload("Seller").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "获取书籍列表失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(gin.H{
		"list":     books,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	}))
}

func GetBook(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "无效的书籍ID"))
		return
	}

	var book models.Book
	if err := database.DB.Preload("Tag").Preload("Seller").
		First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "书籍不存在"))
		return
	}

	c.JSON(http.StatusOK, config.Success(book))
}

func CreateBook(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req BookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "参数错误: "+err.Error()))
		return
	}

	book := models.Book{
		Title:         req.Title,
		Author:        req.Author,
		ISBN:          req.ISBN,
		Price:         req.Price,
		OriginalPrice: req.OriginalPrice,
		Description:   req.Description,
		Condition:     req.Condition,
		Image:         req.Image,
		Images:        req.Images,
		TagID:         req.TagID,
		SellerID:      userID,
		Status:        "available",
	}

	if err := database.DB.Create(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "发布书籍失败: "+err.Error()))
		return
	}

	database.DB.Preload("Tag").Preload("Seller").First(&book, book.ID)

	c.JSON(http.StatusOK, config.Success(book))
}

func UpdateBook(c *gin.Context) {
	userID := middleware.GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "无效的书籍ID"))
		return
	}

	var book models.Book
	if err := database.DB.First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "书籍不存在"))
		return
	}

	if book.SellerID != userID {
		c.JSON(http.StatusForbidden, config.Error(403, "无权限修改此书"))
		return
	}

	var req BookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "参数错误: "+err.Error()))
		return
	}

	updates := map[string]interface{}{
		"title":          req.Title,
		"author":         req.Author,
		"isbn":           req.ISBN,
		"price":          req.Price,
		"original_price": req.OriginalPrice,
		"description":    req.Description,
		"condition":      req.Condition,
		"image":          req.Image,
		"images":         req.Images,
		"tag_id":         req.TagID,
	}

	if err := database.DB.Model(&book).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "更新书籍失败"))
		return
	}

	database.DB.Preload("Tag").Preload("Seller").First(&book, book.ID)

	c.JSON(http.StatusOK, config.Success(book))
}

func DeleteBook(c *gin.Context) {
	userID := middleware.GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "无效的书籍ID"))
		return
	}

	var book models.Book
	if err := database.DB.First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "书籍不存在"))
		return
	}

	if book.SellerID != userID {
		c.JSON(http.StatusForbidden, config.Error(403, "无权限删除此书"))
		return
	}

	if err := database.DB.Delete(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "删除书籍失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(nil))
}

func ScanISBN(c *gin.Context) {
	var req struct {
		ISBN string `json:"isbn" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "参数错误: "+err.Error()))
		return
	}

	mockData := map[string]gin.H{
		"9787040396638": {
			"title":         "高等数学（第七版）上册",
			"author":        "同济大学数学系",
			"originalPrice": 42.5,
			"description":   "同济大学数学系编，经典高数教材。",
		},
		"9787040396621": {
			"title":         "高等数学（第七版）下册",
			"author":        "同济大学数学系",
			"originalPrice": 39.8,
			"description":   "同济大学数学系编，经典高数教材。",
		},
		"9787111544937": {
			"title":         "深入理解计算机系统",
			"author":        "Randal E.Bryant",
			"originalPrice": 139.0,
			"description":   "CSAPP经典教材，从程序员的视角讲解计算机系统。",
		},
		"9787111407010": {
			"title":         "算法导论（原书第3版）",
			"author":        "Thomas H.Cormen",
			"originalPrice": 128.0,
			"description":   "算法圣经，全面覆盖算法设计与分析。",
		},
	}

	if data, exists := mockData[req.ISBN]; exists {
		c.JSON(http.StatusOK, config.Success(data))
		return
	}

	c.JSON(http.StatusOK, config.Success(gin.H{
		"title":         "未知书籍",
		"author":        "未知作者",
		"originalPrice": 0,
		"description":   "未找到该ISBN对应的书籍信息，请手动填写。",
	}))
}
