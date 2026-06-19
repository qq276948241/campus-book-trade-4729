package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"github.com/shuwo/server/internal/config"
	"github.com/shuwo/server/internal/database"
	"github.com/shuwo/server/internal/middleware"
	"github.com/shuwo/server/internal/models"
)

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Nickname string `json:"nickname"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "参数错误: "+err.Error()))
		return
	}

	var count int64
	database.DB.Model(&models.User{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, config.Error(400, "用户名已存在"))
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "密码加密失败"))
		return
	}

	nickname := req.Nickname
	if nickname == "" {
		nickname = req.Username
	}

	user := models.User{
		Username: req.Username,
		Password: string(hashedPassword),
		Nickname: nickname,
		Avatar:   "https://api.dicebear.com/7.x/avataaars/svg?seed=" + req.Username,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "注册失败: "+err.Error()))
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "生成令牌失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(gin.H{
		"token": token,
		"user":  user,
	}))
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "参数错误: "+err.Error()))
		return
	}

	var user models.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, config.Error(401, "用户名或密码错误"))
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, config.Error(401, "用户名或密码错误"))
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "生成令牌失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(gin.H{
		"token": token,
		"user":  user,
	}))
}

func GetMe(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, config.Error(401, "未登录"))
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "用户不存在"))
		return
	}

	c.JSON(http.StatusOK, config.Success(user))
}
