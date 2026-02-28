package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

func SuccessResponse(c *gin.Context, status int, data interface{}) {
	c.JSON(status, APIResponse{
		Success: true,
		Data:    data,
	})
}

func SuccessMessage(c *gin.Context, message string) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: message,
	})
}

func ErrorResponse(c *gin.Context, status int, err string) {
	c.JSON(status, APIResponse{
		Success: false,
		Error:   err,
	})
}

type PaginatedResponse struct {
	Items      interface{} `json:"items"`
	TotalCount int         `json:"totalCount"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
}

func PaginatedSuccess(c *gin.Context, items interface{}, total, page, pageSize int) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data: PaginatedResponse{
			Items:      items,
			TotalCount: total,
			Page:       page,
			PageSize:   pageSize,
		},
	})
}
