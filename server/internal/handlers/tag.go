package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/shuwo/server/internal/config"
	"github.com/shuwo/server/internal/database"
	"github.com/shuwo/server/internal/models"
)

func GetTags(c *gin.Context) {
	var tags []models.BookTag
	if err := database.DB.Order("id ASC").Find(&tags).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "获取标签列表失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(tags))
}
