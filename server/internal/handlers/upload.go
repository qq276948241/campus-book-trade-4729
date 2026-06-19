package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/shuwo/server/internal/config"
)

func UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "请选择要上传的文件"))
		return
	}

	ext := filepath.Ext(file.Filename)
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, config.Error(400, "不支持的文件格式，仅支持 jpg、jpeg、png、gif、webp"))
		return
	}

	maxSize := int64(10 * 1024 * 1024)
	if file.Size > maxSize {
		c.JSON(http.StatusBadRequest, config.Error(400, "文件大小不能超过 10MB"))
		return
	}

	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join("uploads", filename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "文件保存失败: "+err.Error()))
		return
	}

	fileURL := fmt.Sprintf("/uploads/%s", filename)
	accessURL := fmt.Sprintf("http://localhost:8080/uploads/%s", filename)

	c.JSON(http.StatusOK, config.Success(gin.H{
		"url":      fileURL,
		"fullUrl":  accessURL,
		"filename": filename,
		"size":     file.Size,
	}))
}
