package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"

	"github.com/shuwo/server/internal/database"
	"github.com/shuwo/server/internal/handlers"
	"github.com/shuwo/server/internal/middleware"
)

func main() {
	database.InitDB()

	r := gin.Default()

	r.Use(middleware.CorsMiddleware())

	r.Static("/uploads", "./uploads")

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.GET("/me", middleware.AuthMiddleware(), handlers.GetMe)
		}

		books := api.Group("/books")
		{
			books.GET("", handlers.GetBooks)
			books.GET("/:id", handlers.GetBook)
			books.POST("", middleware.AuthMiddleware(), handlers.CreateBook)
			books.PUT("/:id", middleware.AuthMiddleware(), handlers.UpdateBook)
			books.DELETE("/:id", middleware.AuthMiddleware(), handlers.DeleteBook)
			books.POST("/scan", middleware.AuthMiddleware(), handlers.ScanISBN)
		}

		tags := api.Group("/tags")
		{
			tags.GET("", handlers.GetTags)
		}

		orders := api.Group("/orders")
		{
			orders.Use(middleware.AuthMiddleware())
			orders.POST("", handlers.CreateOrder)
			orders.GET("", handlers.GetOrders)
			orders.GET("/:id", handlers.GetOrder)
			orders.PUT("/:id/ship", handlers.ShipOrder)
			orders.PUT("/:id/confirm", handlers.ConfirmOrder)
		}

		messages := api.Group("/messages")
		{
			messages.Use(middleware.AuthMiddleware())
			messages.GET("/conversations", handlers.GetConversations)
			messages.GET("/:id", handlers.GetMessages)
			messages.POST("", handlers.SendMessage)
			messages.POST("/conversation", handlers.CreateOrGetConversation)
		}

		reviews := api.Group("/reviews")
		{
			reviews.POST("", middleware.AuthMiddleware(), handlers.CreateReview)
			reviews.GET("", handlers.GetReviews)
		}

		profile := api.Group("/profile")
		{
			profile.Use(middleware.AuthMiddleware())
			profile.GET("/books", handlers.GetMyBooks)
			profile.GET("/orders", handlers.GetMyOrders)
			profile.GET("/reviews", handlers.GetMyReviews)
		}

		upload := api.Group("/upload")
		{
			upload.POST("", middleware.AuthMiddleware(), handlers.UploadImage)
		}
	}

	fmt.Println("Go backend is running on :8080")
	log.Fatal(r.Run(":8080"))
}
