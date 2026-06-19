package database

import (
	"database/sql"
	"log"
	"math/rand"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/shuwo/server/internal/config"
	"github.com/shuwo/server/internal/models"
)

var DB *gorm.DB

func InitDB() {
	var err error

	sqlDB, err := sql.Open("sqlite", config.DBPath+"?_pragma=foreign_keys(1)")
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	DB, err = gorm.Open(sqlite.Dialector{
		Conn: sqlDB,
	}, &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.BookTag{},
		&models.Book{},
		&models.Order{},
		&models.Logistics{},
		&models.Conversation{},
		&models.Message{},
		&models.Review{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	seedData()
}

func hashPassword(password string) string {
	hashed, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hashed)
}

func seedData() {
	var userCount int64
	DB.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		return
	}

	tags := []models.BookTag{
		{Name: "教材教辅"},
		{Name: "小说文学"},
		{Name: "科技编程"},
		{Name: "历史人文"},
		{Name: "经济管理"},
		{Name: "外语学习"},
	}
	for i := range tags {
		DB.Create(&tags[i])
	}

	buyer := models.User{
		Username: "buyer",
		Password: hashPassword("123456"),
		Nickname: "小明同学",
		Avatar:   "https://api.dicebear.com/7.x/avataaars/svg?seed=buyer",
		Phone:    "13800138001",
		Location: "学生宿舍1号楼",
	}
	DB.Create(&buyer)

	seller := models.User{
		Username: "seller",
		Password: hashPassword("123456"),
		Nickname: "书趣阁店主",
		Avatar:   "https://api.dicebear.com/7.x/avataaars/svg?seed=seller",
		Phone:    "13800138002",
		Location: "学生宿舍3号楼",
	}
	DB.Create(&seller)

	books := []models.Book{
		{
			Title:         "高等数学（第七版）上册",
			Author:        "同济大学数学系",
			ISBN:          "9787040396638",
			Price:         25.0,
			OriginalPrice: 42.5,
			Description:   "九成新，笔记少，适合大一新生使用。同济大学数学系编，经典高数教材。",
			Condition:     "九成新",
			Status:        "available",
			Image:         "https://picsum.photos/seed/book1/400/560",
			Images:        `["https://picsum.photos/seed/book1/400/560"]`,
			TagID:         tags[0].ID,
			SellerID:      seller.ID,
		},
		{
			Title:         "高等数学（第七版）下册",
			Author:        "同济大学数学系",
			ISBN:          "9787040396621",
			Price:         23.0,
			OriginalPrice: 39.8,
			Description:   "八成新，少量笔记，包含课后习题解答标记。",
			Condition:     "八成新",
			Status:        "available",
			Image:         "https://picsum.photos/seed/book2/400/560",
			Images:        `["https://picsum.photos/seed/book2/400/560"]`,
			TagID:         tags[0].ID,
			SellerID:      seller.ID,
		},
		{
			Title:         "深入理解计算机系统",
			Author:        "Randal E.Bryant",
			ISBN:          "9787111544937",
			Price:         65.0,
			OriginalPrice: 139.0,
			Description:   "CSAPP经典教材，几乎全新，仅翻阅过前两章。从程序员的视角讲解计算机系统。",
			Condition:     "全新",
			Status:        "available",
			Image:         "https://picsum.photos/seed/book3/400/560",
			Images:        `["https://picsum.photos/seed/book3/400/560"]`,
			TagID:         tags[2].ID,
			SellerID:      seller.ID,
		},
		{
			Title:         "算法导论（原书第3版）",
			Author:        "Thomas H.Cormen",
			ISBN:          "9787111407010",
			Price:         55.0,
			OriginalPrice: 128.0,
			Description:   "算法圣经，七成新，有少量笔记和下划线标记。",
			Condition:     "七成新",
			Status:        "available",
			Image:         "https://picsum.photos/seed/book4/400/560",
			Images:        `["https://picsum.photos/seed/book4/400/560"]`,
			TagID:         tags[2].ID,
			SellerID:      seller.ID,
		},
		{
			Title:         "活着",
			Author:        "余华",
			ISBN:          "9787506365437",
			Price:         12.0,
			OriginalPrice: 35.0,
			Description:   "余华经典作品，九成新，无笔迹。讲述福贵坎坷一生的故事。",
			Condition:     "九成新",
			Status:        "available",
			Image:         "https://picsum.photos/seed/book5/400/560",
			Images:        `["https://picsum.photos/seed/book5/400/560"]`,
			TagID:         tags[1].ID,
			SellerID:      seller.ID,
		},
		{
			Title:         "人类简史：从动物到上帝",
			Author:        "尤瓦尔·赫拉利",
			ISBN:          "9787508647357",
			Price:         30.0,
			OriginalPrice: 68.0,
			Description:   "八成新，热门历史科普读物，带你重新审视人类历史。",
			Condition:     "八成新",
			Status:        "available",
			Image:         "https://picsum.photos/seed/book6/400/560",
			Images:        `["https://picsum.photos/seed/book6/400/560"]`,
			TagID:         tags[3].ID,
			SellerID:      seller.ID,
		},
	}

	for i := range books {
		books[i].CreatedAt = time.Now().Add(time.Duration(-rand.Intn(30)) * 24 * time.Hour)
		DB.Create(&books[i])
	}

	log.Println("Seed data created successfully")
}
