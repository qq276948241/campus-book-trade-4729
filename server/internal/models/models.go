package models

import (
	"time"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"size:50;unique;not null" json:"username"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	Nickname  string    `gorm:"size:50" json:"nickname"`
	Avatar    string    `gorm:"size:255" json:"avatar"`
	Phone     string    `gorm:"size:20" json:"phone"`
	Location  string    `gorm:"size:100" json:"location"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type BookTag struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:50;unique;not null" json:"name"`
	CreatedAt time.Time `json:"createdAt"`
}

type Book struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"size:200;not null" json:"title"`
	Author      string    `gorm:"size:100" json:"author"`
	ISBN        string    `gorm:"size:50" json:"isbn"`
	Price       float64   `gorm:"not null" json:"price"`
	OriginalPrice float64 `json:"originalPrice"`
	Description string    `gorm:"type:text" json:"description"`
	Condition   string    `gorm:"size:20" json:"condition"`
	Status      string    `gorm:"size:20;default:'available'" json:"status"`
	Image       string    `gorm:"size:255" json:"image"`
	Images      string    `gorm:"type:text" json:"images"`
	TagID       uint      `json:"tagId"`
	Tag         BookTag   `gorm:"foreignKey:TagID" json:"tag,omitempty"`
	SellerID    uint      `json:"sellerId"`
	Seller      User      `gorm:"foreignKey:SellerID" json:"seller,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Order struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OrderNo     string    `gorm:"size:50;unique;not null" json:"orderNo"`
	BookID      uint      `json:"bookId"`
	Book        Book      `gorm:"foreignKey:BookID" json:"book,omitempty"`
	BuyerID     uint      `json:"buyerId"`
	Buyer       User      `gorm:"foreignKey:BuyerID" json:"buyer,omitempty"`
	SellerID    uint      `json:"sellerId"`
	Seller      User      `gorm:"foreignKey:SellerID" json:"seller,omitempty"`
	Price       float64   `gorm:"not null" json:"price"`
	Status      string    `gorm:"size:20;default:'pending'" json:"status"`
	Address     string    `gorm:"size:255" json:"address"`
	Phone       string    `gorm:"size:20" json:"phone"`
	Receiver    string    `gorm:"size:50" json:"receiver"`
	LogisticsNo string    `gorm:"size:50" json:"logisticsNo"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Logistics struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OrderID     uint      `json:"orderId"`
	LogisticsNo string    `gorm:"size:50" json:"logisticsNo"`
	Status      string    `gorm:"size:50" json:"status"`
	Location    string    `gorm:"size:255" json:"location"`
	Description string    `gorm:"size:255" json:"description"`
	Time        time.Time `json:"time"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Conversation struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	User1ID    uint      `json:"user1Id"`
	User1      User      `gorm:"foreignKey:User1ID" json:"user1,omitempty"`
	User2ID    uint      `json:"user2Id"`
	User2      User      `gorm:"foreignKey:User2ID" json:"user2,omitempty"`
	BookID     uint      `json:"bookId"`
	Book       Book      `gorm:"foreignKey:BookID" json:"book,omitempty"`
	LastMsg    string    `gorm:"size:500" json:"lastMsg"`
	LastMsgAt  time.Time `json:"lastMsgAt"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type Message struct {
	ID             uint         `gorm:"primaryKey" json:"id"`
	ConversationID uint         `json:"conversationId"`
	Conversation   Conversation `gorm:"foreignKey:ConversationID" json:"conversation,omitempty"`
	SenderID       uint         `json:"senderId"`
	Sender         User         `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	ReceiverID     uint         `json:"receiverId"`
	Receiver       User         `gorm:"foreignKey:ReceiverID" json:"receiver,omitempty"`
	Content        string       `gorm:"type:text;not null" json:"content"`
	Type           string       `gorm:"size:20;default:'text'" json:"type"`
	IsRead         bool         `gorm:"default:false" json:"isRead"`
	CreatedAt      time.Time    `json:"createdAt"`
}

type Review struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	OrderID   uint      `json:"orderId"`
	Order     Order     `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	BookID    uint      `json:"bookId"`
	Book      Book      `gorm:"foreignKey:BookID" json:"book,omitempty"`
	UserID    uint      `json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Rating    int       `gorm:"not null" json:"rating"`
	Content   string    `gorm:"type:text" json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}
