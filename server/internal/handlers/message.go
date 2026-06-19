package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/shuwo/server/internal/config"
	"github.com/shuwo/server/internal/database"
	"github.com/shuwo/server/internal/middleware"
	"github.com/shuwo/server/internal/models"
)

type MessageRequest struct {
	ConversationID uint   `json:"conversationId"`
	ReceiverID     uint   `json:"receiverId" binding:"required"`
	Content        string `json:"content" binding:"required"`
	Type           string `json:"type"`
}

type ConversationRequest struct {
	UserID uint `json:"userId" binding:"required"`
	BookID uint `json:"bookId"`
}

func GetConversations(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var conversations []models.Conversation
	if err := database.DB.Where("user1_id = ? OR user2_id = ?", userID, userID).
		Preload("User1").Preload("User2").Preload("Book").
		Order("last_msg_at DESC").
		Find(&conversations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "获取会话列表失败"))
		return
	}

	c.JSON(http.StatusOK, config.Success(conversations))
}

func GetMessages(c *gin.Context) {
	userID := middleware.GetUserID(c)

	conversationID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "无效的会话ID"))
		return
	}

	var conversation models.Conversation
	if err := database.DB.First(&conversation, conversationID).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "会话不存在"))
		return
	}

	if conversation.User1ID != userID && conversation.User2ID != userID {
		c.JSON(http.StatusForbidden, config.Error(403, "无权限查看此会话"))
		return
	}

	var messages []models.Message
	if err := database.DB.Where("conversation_id = ?", conversationID).
		Preload("Sender").Preload("Receiver").
		Order("created_at DESC").
		Limit(50).
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "获取消息列表失败"))
		return
	}

	for i := range messages {
		if messages[i].ReceiverID == userID && !messages[i].IsRead {
			messages[i].IsRead = true
			database.DB.Model(&messages[i]).Update("is_read", true)
		}
	}

	c.JSON(http.StatusOK, config.Success(messages))
}

func SendMessage(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req MessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "参数错误: "+err.Error()))
		return
	}

	if req.ReceiverID == userID {
		c.JSON(http.StatusBadRequest, config.Error(400, "不能给自己发送消息"))
		return
	}

	conversationID := req.ConversationID

	if conversationID == 0 {
		var conversation models.Conversation
		result := database.DB.Where(
			"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
			userID, req.ReceiverID, req.ReceiverID, userID,
		).First(&conversation)

		if result.Error != nil {
			conversation = models.Conversation{
				User1ID:   userID,
				User2ID:   req.ReceiverID,
				LastMsg:   req.Content,
				LastMsgAt: time.Now(),
			}
			if err := database.DB.Create(&conversation).Error; err != nil {
				c.JSON(http.StatusInternalServerError, config.Error(500, "创建会话失败"))
				return
			}
		} else {
			conversation.LastMsg = req.Content
			conversation.LastMsgAt = time.Now()
			database.DB.Save(&conversation)
		}
		conversationID = conversation.ID
	} else {
		var conversation models.Conversation
		if err := database.DB.First(&conversation, conversationID).Error; err != nil {
			c.JSON(http.StatusNotFound, config.Error(404, "会话不存在"))
			return
		}
		conversation.LastMsg = req.Content
		conversation.LastMsgAt = time.Now()
		database.DB.Save(&conversation)
	}

	msgType := req.Type
	if msgType == "" {
		msgType = "text"
	}

	message := models.Message{
		ConversationID: conversationID,
		SenderID:       userID,
		ReceiverID:     req.ReceiverID,
		Content:        req.Content,
		Type:           msgType,
		IsRead:         false,
	}

	if err := database.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, config.Error(500, "发送消息失败: "+err.Error()))
		return
	}

	database.DB.Preload("Sender").Preload("Receiver").First(&message, message.ID)

	c.JSON(http.StatusOK, config.Success(message))
}

func CreateOrGetConversation(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req ConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, config.Error(400, "参数错误: "+err.Error()))
		return
	}

	if req.UserID == userID {
		c.JSON(http.StatusBadRequest, config.Error(400, "不能与自己创建会话"))
		return
	}

	var user2 models.User
	if err := database.DB.First(&user2, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, config.Error(404, "对方用户不存在"))
		return
	}

	var conversation models.Conversation
	result := database.DB.Where(
		"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		userID, req.UserID, req.UserID, userID,
	).First(&conversation)

	if result.Error != nil {
		conversation = models.Conversation{
			User1ID:   userID,
			User2ID:   req.UserID,
			BookID:    req.BookID,
			LastMsg:   "",
			LastMsgAt: time.Now(),
		}
		if err := database.DB.Create(&conversation).Error; err != nil {
			c.JSON(http.StatusInternalServerError, config.Error(500, "创建会话失败"))
			return
		}
	}

	database.DB.Preload("User1").Preload("User2").Preload("Book").First(&conversation, conversation.ID)

	c.JSON(http.StatusOK, config.Success(conversation))
}
