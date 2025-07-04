## Mục lục

1. [Quản lý Sản phẩm](#1-quản-lý-sản-phẩm)
2. [Quản lý Voucher](#2-quản-lý-voucher)
3. [Quản lý Khuyến mãi](#3-quản-lý-khuyến-mãi-promotion)
4. [Quản lý Đơn hàng](#4-quản-lý-đơn-hàng)
5. [Quản lý Trả hàng](#5-quản-lý-trả-hàng)
6. [Quản lý Tài khoản](#6-quản-lý-tài-khoản)
7. [Thống kê và Báo cáo](#7-thống-kê-và-báo-cáo)
8. [Xác thực và Phân quyền](#8-xác-thực-và-phân-quyền)
9. [Quản lý Thuộc tính Sản phẩm](#9-quản-lý-thuộc-tính-sản-phẩm)

## Giới thiệu chung

- Base URL: `http://localhost:5000` (hoặc domain triển khai)
- Xác thực: Sử dụng JWT Token trong header `Authorization: Bearer {token}`
- Format dữ liệu: JSON

## 1. Quản lý Sản phẩm

### 1.1. Tạo sản phẩm mới
- **Route**: `/api/products`
- **Method**: POST
- **Payload**:
  ```json
  {
    "name": "string",
    "brand": "string",
    "category": "string",
    "material": "string",
    "description": "string",
    "weight": "number",
    "variants": [
      {
        "colorId": "string",
        "sizeId": "string",
        "price": "number",
        "stock": "number",
        "images": ["string"]
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "brand": "string",
      "category": "string",
      "material": "string",
      "description": "string",
      "weight": "number",
      "variants": [...],
      "status": "ACTIVE",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 1.2. Lấy danh sách sản phẩm
- **Route**: `/api/products`
- **Method**: GET
- **Request Params**:
  - `name` (string, optional): Tìm kiếm theo tên
  - `brand` (string, optional): Lọc theo thương hiệu
  - `category` (string, optional): Lọc theo danh mục
  - `material` (string, optional): Lọc theo chất liệu
  - `color` (string, optional): Lọc theo màu sắc
  - `size` (string, optional): Lọc theo kích cỡ
  - `minPrice` (number, optional): Giá thấp nhất
  - `maxPrice` (number, optional): Giá cao nhất
  - `status` (string, optional): Trạng thái (HOAT_DONG/INACTIVE)
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng sản phẩm mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "name": "string",
        "brand": "object",
        "category": "object",
        "material": "object",
        "variants": [...],
        "status": "string"
      }
    ]
  }
  ```

### 1.3. Lấy các bộ lọc sản phẩm
- **Route**: `/api/products/filters`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "colors": [...],
      "sizes": [...],
      "brands": [...],
      "categories": [...],
      "materials": [...],
      "priceRange": {
        "min": "number",
        "max": "number"
      }
    }
  }
  ```

### 1.4. Tìm kiếm sản phẩm
- **Route**: `/api/products/search`
- **Method**: GET
- **Request Params**:
  - `keyword` (string, required): Từ khóa tìm kiếm
  - (Các bộ lọc tương tự như lấy danh sách sản phẩm)
- **Response**: (Tương tự response lấy danh sách sản phẩm)

### 1.5. Lấy chi tiết sản phẩm
- **Route**: `/api/products/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "brand": "object",
      "category": "object",
      "material": "object",
      "description": "string",
      "weight": "number",
      "variants": [...],
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 1.6. Cập nhật sản phẩm
- **Route**: `/api/products/:id`
- **Method**: PUT
- **Payload**: (Tương tự như tạo sản phẩm, các trường có thể cập nhật một phần)
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "brand": "string",
      "category": "string",
      "material": "string",
      "description": "string",
      "weight": "number",
      "variants": [...],
      "status": "string",
      "updatedAt": "date"
    }
  }
  ```

### 1.7. Xóa sản phẩm
- **Route**: `/api/products/:id`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa sản phẩm thành công"
  }
  ```

### 1.8. Cập nhật trạng thái sản phẩm
- **Route**: `/api/products/:id/status`
- **Method**: PATCH
- **Payload**:
  ```json
  {
    "status": "ACTIVE | INACTIVE"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "status": "string",
      "updatedAt": "date"
    }
  }
  ```

### 1.9. Cập nhật tồn kho
- **Route**: `/api/products/:id/stock`
- **Method**: PATCH
- **Payload**:
  ```json
  {
    "variantUpdates": [
      {
        "variantId": "string",
        "stock": "number"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "variants": [...],
      "updatedAt": "date"
    }
  }
  ```

### 1.10. Cập nhật hình ảnh
- **Route**: `/api/products/:id/images`
- **Method**: PATCH
- **Payload**:
  ```json
  {
    "variantId": "string",
    "images": ["string"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "variants": [...],
      "updatedAt": "date"
    }
  }
  ```

## 2. Quản lý Voucher

### 2.1. Tạo phiếu giảm giá
- **Route**: `/api/vouchers`
- **Method**: POST
- **Payload**:
  ```json
  {
    "code": "string",
    "name": "string",
    "type": "PERCENTAGE | FIXED_AMOUNT",
    "value": "number",
    "quantity": "number",
    "startDate": "date",
    "endDate": "date",
    "minOrderValue": "number",
    "maxDiscount": "number",
    "status": "ACTIVE | INACTIVE"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "code": "string",
      "name": "string",
      "type": "string",
      "value": "number",
      "quantity": "number",
      "usedCount": 0,
      "startDate": "date",
      "endDate": "date",
      "minOrderValue": "number",
      "maxDiscount": "number",
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 2.2. Lấy danh sách voucher
- **Route**: `/api/vouchers`
- **Method**: GET
- **Request Params**:
  - `code` (string, optional): Lọc theo mã
  - `name` (string, optional): Lọc theo tên
  - `status` (string, optional): Lọc theo trạng thái
  - `startDate` (date, optional): Lọc từ ngày
  - `endDate` (date, optional): Lọc đến ngày
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "code": "string",
        "name": "string",
        "type": "string",
        "value": "number",
        "quantity": "number",
        "usedCount": "number",
        "startDate": "date",
        "endDate": "date",
        "status": "string"
      }
    ]
  }
  ```

### 2.3. Lấy chi tiết voucher
- **Route**: `/api/vouchers/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "code": "string",
      "name": "string",
      "type": "string",
      "value": "number",
      "quantity": "number",
      "usedCount": "number",
      "startDate": "date",
      "endDate": "date",
      "minOrderValue": "number",
      "maxDiscount": "number",
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 2.4. Cập nhật voucher
- **Route**: `/api/vouchers/:id`
- **Method**: PUT
- **Payload**: (Các trường có thể cập nhật một phần)
  ```json
  {
    "name": "string",
    "quantity": "number",
    "startDate": "date",
    "endDate": "date",
    "minOrderValue": "number",
    "maxDiscount": "number",
    "status": "ACTIVE | INACTIVE"
  }
  ```
- **Response**: (Tương tự response lấy chi tiết voucher)

### 2.5. Xóa voucher
- **Route**: `/api/vouchers/:id`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa voucher thành công"
  }
  ```

### 2.6. Kiểm tra voucher hợp lệ
- **Route**: `/api/vouchers/validate`
- **Method**: POST
- **Payload**:
  ```json
  {
    "code": "string",
    "orderValue": "number"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "code": "string",
      "type": "string",
      "value": "number",
      "discountAmount": "number",
      "minOrderValue": "number"
    }
  }
  ```

### 2.7. Tăng số lượt sử dụng
- **Route**: `/api/vouchers/:id/increment-usage`
- **Method**: PUT
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "usedCount": "number",
      "updatedAt": "date"
    }
  }
  ```

### 2.8. Gửi thông báo về voucher
- **Route**: `/api/vouchers/:id/notify`
- **Method**: POST
- **Response**:
  ```json
  {
    "success": true,
    "message": "Đã gửi thông báo về voucher tới tất cả khách hàng"
  }
  ```

### 2.9. Lấy danh sách voucher có sẵn cho người dùng
- **Route**: `/api/vouchers/user/:userId`
- **Method**: GET
- **Access**: Private (User needs to be authenticated)
- **Description**: Lấy danh sách các phiếu giảm giá đang hoạt động, còn hiệu lực và còn số lượng mà người dùng (xác định bởi `userId`) có thể sử dụng.
- **Path Parameters**:
  - `userId` (string, required): ID của người dùng.
- **Query Parameters**:
  - `page` (number, optional, default: 1): Số trang.
  - `limit` (number, optional, default: 10): Số lượng voucher mỗi trang.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách phiếu giảm giá có sẵn thành công",
    "data": {
      "vouchers": [
        {
          "_id": "string",
          "code": "string",
          "name": "string",
          "type": "PERCENTAGE | FIXED_AMOUNT",
          "value": "number",
          "quantity": "number",
          "usedCount": "number",
          "startDate": "date",
          "endDate": "date",
          "minOrderValue": "number",
          "maxDiscount": "number",
          "status": "ACTIVE"
        }
      ],
      "pagination": {
        "totalItems": "number",
        "totalPages": "number",
        "currentPage": "number",
        "limit": "number"
      }
    }
  }
  ```

## 3. Quản lý Khuyến mãi (Promotion)

### 3.1. Tạo chương trình khuyến mãi
- **Route**: `/api/promotions`
- **Method**: POST
- **Payload**:
  ```json
  {
    "name": "string",
    "description": "string",
    "discountPercent": "number",
    "products": ["string"],
    "startDate": "date",
    "endDate": "date"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "discountPercent": "number",
      "products": ["string"],
      "startDate": "date",
      "endDate": "date",
      "status": "ACTIVE",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 3.2. Lấy danh sách khuyến mãi
- **Route**: `/api/promotions`
- **Method**: GET
- **Request Params**:
  - `status` (string, optional): Lọc theo trạng thái
  - `search` (string, optional): Tìm kiếm theo tên
  - `startDate` (date, optional): Lọc từ ngày
  - `endDate` (date, optional): Lọc đến ngày
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "name": "string",
        "discountPercent": "number",
        "startDate": "date",
        "endDate": "date",
        "status": "string",
        "productCount": "number"
      }
    ]
  }
  ```

### 3.3. Lấy chi tiết khuyến mãi
- **Route**: `/api/promotions/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "discountPercent": "number",
      "products": [
        {
          "_id": "string",
          "name": "string",
          "brand": "object",
          "category": "object"
        }
      ],
      "startDate": "date",
      "endDate": "date",
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 3.4. Cập nhật khuyến mãi
- **Route**: `/api/promotions/:id`
- **Method**: PUT
- **Payload**: (Các trường có thể cập nhật một phần)
  ```json
  {
    "name": "string",
    "description": "string",
    "discountPercent": "number",
    "products": ["string"],
    "startDate": "date",
    "endDate": "date",
    "status": "ACTIVE | INACTIVE"
  }
  ```
- **Response**: (Tương tự response lấy chi tiết khuyến mãi)

### 3.5. Xóa khuyến mãi
- **Route**: `/api/promotions/:id`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa khuyến mãi thành công"
  }
  ```

### 3.6. Lấy khuyến mãi của sản phẩm
- **Route**: `/api/promotions/product/:productId`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "string",
        "name": "string",
        "discountPercent": "number",
        "startDate": "date",
        "endDate": "date",
        "status": "string"
      }
    ]
  }
  ``` 

## 4. Quản lý Đơn hàng

### 4.1. Tạo đơn hàng
- **Route**: `/api/orders`
- **Method**: POST
- **Payload**:
  ```json
  {
    "customer": "string",
    "items": [
      {
        "product": "string",
        "variant": {
          "colorId": "string",
          "sizeId": "string"
        },
        "quantity": "number",
        "price": "number"
      }
    ],
    "voucher": "string",
    "subTotal": "number",
    "discount": "number",
    "total": "number",
    "shippingAddress": {
      "name": "string",
      "phoneNumber": "string",
      "provinceId": "string",
      "districtId": "string",
      "wardId": "string",
      "specificAddress": "string"
    },
    "paymentMethod": "CASH | BANK_TRANSFER | COD | MIXED"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "orderNumber": "string",
      "customer": "object",
      "items": [...],
      "voucher": "object",
      "subTotal": "number",
      "discount": "number",
      "total": "number",
      "shippingAddress": "object",
      "paymentMethod": "string",
      "orderStatus": "CHO_XAC_NHAN",
      "paymentStatus": "PENDING",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 4.2. Lấy danh sách đơn hàng (Admin)
- **Route**: `/api/orders`
- **Method**: GET
- **Request Params**:
  - `customer` (string, optional): Lọc theo khách hàng
  - `orderStatus` (string, optional): Lọc theo trạng thái đơn hàng
  - `paymentStatus` (string, optional): Lọc theo trạng thái thanh toán
  - `startDate` (date, optional): Lọc từ ngày
  - `endDate` (date, optional): Lọc đến ngày
  - `search` (string, optional): Tìm kiếm theo mã
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "orderNumber": "string",
        "customer": "object",
        "total": "number",
        "orderStatus": "string",
        "paymentStatus": "string",
        "createdAt": "date"
      }
    ]
  }
  ```

### 4.3. Lấy đơn hàng của người dùng
- **Route**: `/api/orders/my-orders`
- **Method**: GET
- **Request Params**:
  - `orderStatus` (string, optional): Lọc theo trạng thái
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "orderNumber": "string",
        "total": "number",
        "orderStatus": "string",
        "paymentStatus": "string",
        "createdAt": "date"
      }
    ]
  }
  ```

### 4.4. Lấy chi tiết đơn hàng
- **Route**: `/api/orders/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "orderNumber": "string",
      "customer": "object",
      "items": [
        {
          "product": "object",
          "variant": "object",
          "quantity": "number",
          "price": "number",
          "subTotal": "number"
        }
      ],
      "voucher": "object",
      "subTotal": "number",
      "discount": "number",
      "total": "number",
      "shippingAddress": "object",
      "paymentMethod": "string",
      "orderStatus": "string",
      "paymentStatus": "string",
      "histories": [
        {
          "status": "string",
          "timestamp": "date",
          "note": "string"
        }
      ],
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 4.5. Cập nhật đơn hàng
- **Route**: `/api/orders/:id`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "shippingAddress": "object",
    "orderStatus": "string",
    "paymentStatus": "string"
  }
  ```
- **Response**: (Tương tự response lấy chi tiết đơn hàng)

### 4.6. Hủy đơn hàng
- **Route**: `/api/orders/:id/cancel`
- **Method**: PATCH
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "orderStatus": "DA_HUY",
      "histories": [
        {
          "status": "DA_HUY",
          "timestamp": "date",
          "note": "Đơn hàng đã bị hủy"
        }
      ],
      "updatedAt": "date"
    }
  }
  ```

### 4.7. Cập nhật trạng thái đơn hàng
- **Route**: `/api/orders/:id/status`
- **Method**: PATCH
- **Payload**:
  ```json
  {
    "status": "CHO_XAC_NHAN | CHO_GIAO_HANG | DANG_VAN_CHUYEN | DA_GIAO_HANG | HOAN_THANH | DA_HUY"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "orderStatus": "string",
      "histories": [
        {
          "status": "string",
          "timestamp": "date",
          "note": "string"
        }
      ],
      "updatedAt": "date"
    }
  }
  ```

- **Route**: `/api/orders/pos`
- **Method**: POST
- **Payload**:
  ```json
  {
    "customer": "string",
    "items": [
      {
        "product": "string",
        "variant": {
          "colorId": "string",
          "sizeId": "string"
        },
        "quantity": "number",
        "price": "number"
      }
    ],
    "voucher": "string",
    "subTotal": "number",
    "discount": "number",
    "total": "number",
    "shippingAddress": {
      "name": "string",
      "phoneNumber": "string",
      "provinceId": "string",
      "districtId": "string",
      "wardId": "string",
      "specificAddress": "string"
    },
    "paymentMethod": "CASH | BANK_TRANSFER | COD | MIXED"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "orderNumber": "string",
      "customer": "object",
      "items": [...],
      "voucher": "object",
      "subTotal": "number",
      "discount": "number",
      "total": "number",
      "shippingAddress": "object",
      "paymentMethod": "string",
      "orderStatus": "CHO_XAC_NHAN",
      "paymentStatus": "PENDING",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

## 5. Quản lý Trả hàng

### 5.1. API cho Admin/Staff

#### 5.1.1. Tạo đơn trả hàng (Admin)
- **Route**: `/api/returns`
- **Method**: POST
- **Access**: Admin/Staff only
- **Payload**:
  ```json
  {
    "originalOrder": "string",
    "customer": "string",
    "items": [
      {
        "product": "string",
        "variant": {
          "colorId": "string",
          "sizeId": "string"
        },
        "quantity": "number",
        "price": "number",
        "reason": "string"
      }
    ],
    "totalRefund": "number"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Tạo đơn trả hàng thành công",
    "data": {
      "_id": "string",
      "code": "string",
      "originalOrder": "string",
      "customer": "object",
      "staff": "string",
      "items": [...],
      "totalRefund": "number",
      "status": "CHO_XU_LY",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

#### 5.1.2. Lấy danh sách đơn trả hàng (Admin)
- **Route**: `/api/returns`
- **Method**: GET
- **Access**: Admin/Staff only
- **Request Params**:
  - `status` (string, optional): Lọc theo trạng thái (CHO_XU_LY/DA_HOAN_TIEN/DA_HUY)
  - `customer` (string, optional): Lọc theo ID khách hàng
  - `page` (number, optional, default: 1): Số trang
  - `limit` (number, optional, default: 10): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách đơn trả hàng thành công",
    "data": {
      "returns": [
        {
          "_id": "string",
          "code": "string",
          "originalOrder": {
            "_id": "string",
            "code": "string"
          },
          "customer": {
            "_id": "string",
            "fullName": "string",
            "email": "string",
            "phoneNumber": "string"
          },
          "staff": {
            "_id": "string",
            "fullName": "string"
          },
          "totalRefund": "number",
          "status": "string",
          "createdAt": "date"
        }
      ],
      "pagination": {
        "totalItems": "number",
        "totalPages": "number",
        "currentPage": "number",
        "limit": "number"
      }
    }
  }
  ```

#### 5.1.3. Tìm kiếm đơn trả hàng (Admin)
- **Route**: `/api/returns/search`
- **Method**: GET
- **Access**: Admin/Staff only
- **Request Params**:
  - `query` (string, required): Từ khóa tìm kiếm (mã đơn trả hàng hoặc mã đơn hàng gốc)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Tìm kiếm đơn trả hàng thành công",
    "data": [
      {
        "_id": "string",
        "code": "string",
        "originalOrder": "object",
        "customer": "object",
        "staff": "object",
        "totalRefund": "number",
        "status": "string",
        "createdAt": "date"
      }
    ]
  }
  ```

#### 5.1.4. Lấy thống kê đơn trả hàng (Admin)
- **Route**: `/api/returns/stats`
- **Method**: GET
- **Access**: Admin/Staff only
- **Request Params**:
  - `startDate` (date, optional): Từ ngày
  - `endDate` (date, optional): Đến ngày
- **Response**:
  ```json
  {
    "success": true,
    "message": "Lấy thống kê đơn trả hàng thành công",
    "data": {
      "totalReturns": "number",
      "pendingReturns": "number",
      "refundedReturns": "number",
      "cancelledReturns": "number",
      "totalRefundAmount": "number"
    }
  }
  ```

#### 5.1.5. Lấy chi tiết đơn trả hàng (Admin)
- **Route**: `/api/returns/:id`
- **Method**: GET
- **Access**: Admin/Staff only
- **Response**:
  ```json
  {
    "success": true,
    "message": "Lấy thông tin đơn trả hàng thành công",
    "data": {
      "_id": "string",
      "code": "string",
      "originalOrder": "object",
      "customer": {
        "_id": "string",
        "fullName": "string",
        "email": "string",
        "phoneNumber": "string"
      },
      "staff": {
        "_id": "string",
        "fullName": "string"
      },
      "items": [
        {
          "product": {
            "_id": "string",
            "name": "string",
            "images": ["string"],
            "code": "string",
            "price": "number"
          },
          "variant": {
            "colorId": "string",
            "sizeId": "string"
          },
          "quantity": "number",
          "price": "number",
          "reason": "string"
        }
      ],
      "totalRefund": "number",
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

#### 5.1.6. Cập nhật đơn trả hàng (Admin)
- **Route**: `/api/returns/:id`
- **Method**: PUT
- **Access**: Admin/Staff only
- **Payload**:
  ```json
  {
    "items": [
      {
        "product": "string",
        "variant": {
          "colorId": "string",
          "sizeId": "string"
        },
        "quantity": "number",
        "price": "number",
        "reason": "string"
      }
    ],
    "totalRefund": "number"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Cập nhật đơn trả hàng thành công",
    "data": {
      "_id": "string",
      "code": "string",
      "items": [...],
      "totalRefund": "number",
      "updatedAt": "date"
    }
  }
  ```

#### 5.1.7. Cập nhật trạng thái đơn trả hàng (Admin)
- **Route**: `/api/returns/:id/status`
- **Method**: PUT
- **Access**: Admin/Staff only
- **Payload**:
  ```json
  {
    "status": "CHO_XU_LY | DA_HOAN_TIEN | DA_HUY"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Cập nhật trạng thái đơn trả hàng thành công",
    "data": {
      "_id": "string",
      "status": "string",
      "updatedAt": "date"
    }
  }
  ```
- **Note**: Khi trạng thái chuyển thành `DA_HOAN_TIEN`, hệ thống sẽ tự động cộng lại số lượng tồn kho cho các sản phẩm được trả.

#### 5.1.8. Xóa đơn trả hàng (Admin)
- **Route**: `/api/returns/:id`
- **Method**: DELETE
- **Access**: Admin/Staff only
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa đơn trả hàng thành công"
  }
  ```
- **Note**: Chỉ có thể xóa đơn trả hàng ở trạng thái `CHO_XU_LY`.

### 5.2. API cho Khách hàng

#### 5.2.1. Xem đơn hàng có thể trả
- **Route**: `/api/returns/returnable-orders`
- **Method**: GET
- **Access**: Customer only
- **Description**: Lấy danh sách đơn hàng đã hoàn thành trong vòng 7 ngày có thể trả hàng
- **Request Params**:
  - `page` (number, optional, default: 1): Số trang
  - `limit` (number, optional, default: 10): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách đơn hàng có thể trả thành công",
    "data": {
      "orders": [
        {
          "_id": "string",
          "code": "string",
          "orderStatus": "HOAN_THANH",
          "items": [
            {
              "product": {
                "_id": "string",
                "name": "string",
                "images": ["string"],
                "code": "string"
              },
              "variant": "object",
              "quantity": "number",
              "price": "number"
            }
          ],
          "total": "number",
          "createdAt": "date"
        }
      ],
      "pagination": {
        "totalItems": "number",
        "totalPages": "number",
        "currentPage": "number",
        "limit": "number"
      }
    }
  }
  ```

#### 5.2.2. Tạo yêu cầu trả hàng
- **Route**: `/api/returns/request`
- **Method**: POST
- **Access**: Customer only
- **Payload**:
  ```json
  {
    "originalOrder": "string",
    "items": [
      {
        "product": "string",
        "variant": {
          "colorId": "string",
          "sizeId": "string"
        },
        "quantity": "number"
      }
    ],
    "reason": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Yêu cầu trả hàng đã được gửi thành công",
    "data": {
      "_id": "string",
      "code": "string",
      "originalOrder": "string",
      "customer": "string",
      "staff": null,
      "items": [...],
      "totalRefund": "number",
      "status": "CHO_XU_LY",
      "createdAt": "date"
    }
  }
  ```
- **Validation**:
  - Đơn hàng phải thuộc về khách hàng đang đăng nhập
  - Đơn hàng phải ở trạng thái `HOAN_THANH`
  - Đơn hàng phải được tạo trong vòng 7 ngày
  - Số lượng trả không được vượt quá số lượng trong đơn hàng gốc

#### 5.2.3. Xem danh sách đơn trả hàng của mình
- **Route**: `/api/returns/my`
- **Method**: GET
- **Access**: Customer only
- **Request Params**:
  - `page` (number, optional, default: 1): Số trang
  - `limit` (number, optional, default: 10): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách đơn trả hàng thành công",
    "data": {
      "returns": [
        {
          "_id": "string",
          "code": "string",
          "originalOrder": {
            "_id": "string",
            "code": "string",
            "createdAt": "date"
          },
          "items": [
            {
              "product": {
                "_id": "string",
                "name": "string",
                "images": ["string"],
                "code": "string"
              },
              "variant": "object",
              "quantity": "number",
              "price": "number",
              "reason": "string"
            }
          ],
          "totalRefund": "number",
          "status": "string",
          "createdAt": "date"
        }
      ],
      "pagination": {
        "totalItems": "number",
        "totalPages": "number",
        "currentPage": "number",
        "limit": "number"
      }
    }
  }
  ```

#### 5.2.4. Xem chi tiết đơn trả hàng của mình
- **Route**: `/api/returns/my/:id`
- **Method**: GET
- **Access**: Customer only
- **Response**:
  ```json
  {
    "success": true,
    "message": "Lấy thông tin đơn trả hàng thành công",
    "data": {
      "_id": "string",
      "code": "string",
      "originalOrder": "object",
      "items": [
        {
          "product": {
            "_id": "string",
            "name": "string",
            "images": ["string"],
            "code": "string",
            "price": "number"
          },
          "variant": "object",
          "quantity": "number",
          "price": "number",
          "reason": "string"
        }
      ],
      "totalRefund": "number",
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

#### 5.2.5. Hủy yêu cầu trả hàng
- **Route**: `/api/returns/my/:id/cancel`
- **Method**: PUT
- **Access**: Customer only
- **Response**:
  ```json
  {
    "success": true,
    "message": "Hủy yêu cầu trả hàng thành công"
  }
  ```
- **Note**: Chỉ có thể hủy đơn trả hàng ở trạng thái `CHO_XU_LY`.

### 5.3. Trạng thái đơn trả hàng

| Trạng thái | Mô tả |
|------------|-------|
| `CHO_XU_LY` | Đơn trả hàng đang chờ xử lý |
| `DA_HOAN_TIEN` | Đã hoàn tiền và cộng lại tồn kho |
| `DA_HUY` | Đơn trả hàng đã bị hủy |

### 5.4. Quy tắc trả hàng

1. **Thời hạn trả hàng**: 7 ngày kể từ khi đơn hàng hoàn thành
2. **Điều kiện đơn hàng**: Chỉ được trả hàng cho đơn hàng ở trạng thái `HOAN_THANH`
3. **Số lượng**: Số lượng trả không được vượt quá số lượng trong đơn hàng gốc
4. **Quyền hạn**: 
   - Khách hàng chỉ có thể tạo yêu cầu và hủy yêu cầu (khi còn CHO_XU_LY)
   - Admin/Staff có thể tạo, xem, cập nhật, xóa và thay đổi trạng thái đơn trả hàng
5. **Tự động cộng tồn kho**: Khi trạng thái chuyển thành `DA_HOAN_TIEN`, hệ thống tự động cộng lại số lượng tồn kho

## 6. Quản lý Tài khoản

### 6.1. Lấy danh sách tài khoản (Admin)
- **Route**: `/api/accounts`
- **Method**: GET
- **Request Params**:
  - `role` (string, optional): Lọc theo vai trò
  - `status` (string, optional): Lọc theo trạng thái
  - `search` (string, optional): Tìm kiếm
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "fullName": "string",
        "email": "string",
        "phoneNumber": "string",
        "role": "string",
        "status": "string",
        "avatar": "string",
        "createdAt": "date"
      }
    ]
  }
  ```

### 6.2. Lấy chi tiết tài khoản (Admin)
- **Route**: `/api/accounts/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string",
      "gender": "string",
      "birthday": "date",
      "citizenId": "string",
      "status": "string",
      "avatar": "string",
      "addresses": [
        {
          "_id": "string",
          "name": "string", 
          "phoneNumber": "string",
          "provinceId": "number",
          "districtId": "number",
          "wardId": "number",
          "specificAddress": "string",
          "type": "string",
          "isDefault": "boolean"
        }
      ],
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 6.3. Tạo tài khoản (Đăng ký)
- **Route**: `/api/accounts/register`
- **Method**: POST
- **Payload**:
  ```json
  {
    "fullName": "string",
    "email": "string",
    "password": "string",
    "phoneNumber": "string",
    "role": "CUSTOMER | STAFF | ADMIN",
    "gender": "Nam | Nữ | Khác",
    "birthday": "date",
    "citizenId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string",
      "token": "string"
    }
  }
  ```

### 6.4. Cập nhật tài khoản (Admin)
- **Route**: `/api/accounts/:id`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "gender": "Nam | Nữ | Khác",
    "birthday": "date",
    "citizenId": "string",
    "avatar": "string",
    "status": "ACTIVE | INACTIVE"
  }
  ```
- **Response**: (Tương tự response lấy chi tiết tài khoản)

### 6.5. Cập nhật trạng thái tài khoản
- **Route**: `/api/accounts/:id/status`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "status": "ACTIVE | INACTIVE"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "status": "string",
      "updatedAt": "date"
    }
  }
  ```

### 6.6. Xóa tài khoản
- **Route**: `/api/accounts/:id`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa tài khoản thành công"
  }
  ```

### 6.7. Xem hồ sơ cá nhân
- **Route**: `/api/accounts/profile`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string",
      "gender": "string",
      "birthday": "date",
      "citizenId": "string",
      "avatar": "string",
      "addresses": [...],
      "createdAt": "date"
    }
  }
  ```

### 6.8. Cập nhật hồ sơ cá nhân
- **Route**: `/api/accounts/profile`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "fullName": "string",
    "phoneNumber": "string",
    "gender": "Nam | Nữ | Khác",
    "birthday": "date",
    "avatar": "string"
  }
  ```
- **Response**: (Tương tự response xem hồ sơ cá nhân)

### 6.9. Đổi mật khẩu
- **Route**: `/api/accounts/profile/password`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string",
    "confirmPassword": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Đổi mật khẩu thành công"
  }
  ```

### 6.10. Thêm địa chỉ mới
- **Route**: `/api/accounts/profile/addresses`
- **Method**: POST
- **Payload**:
  ```json
  {
    "name": "string",
    "phoneNumber": "string",
    "provinceId": "number",
    "districtId": "number",
    "wardId": "number",
    "specificAddress": "string",
    "type": "Nhà riêng | Văn phòng",
    "isDefault": "boolean"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "addresses": [...],
      "updatedAt": "date"
    }
  }
  ```

### 6.11. Cập nhật địa chỉ
- **Route**: `/api/accounts/profile/addresses/:addressId`
- **Method**: PUT
- **Payload**: (Tương tự payload thêm địa chỉ mới)
- **Response**: (Tương tự response thêm địa chỉ mới)

### 6.12. Xóa địa chỉ
- **Route**: `/api/accounts/profile/addresses/:addressId`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "addresses": [...],
      "updatedAt": "date"
    }
  }
  ```

## 7. Thống kê và Báo cáo

### 7.1. Lấy danh sách thống kê
- **Route**: `/api/statistics`
- **Method**: GET
- **Request Params**:
  - `type` (string, optional): Loại thống kê (DAILY/WEEKLY/MONTHLY/YEARLY)
  - `startDate` (date, optional): Từ ngày
  - `endDate` (date, optional): Đến ngày
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "date": "date",
        "type": "string",
        "totalOrders": "number",
        "totalRevenue": "number",
        "totalProfit": "number"
      }
    ]
  }
  ```

### 7.2. Lấy chi tiết thống kê
- **Route**: `/api/statistics/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "date": "date",
      "type": "string",
      "totalOrders": "number",
      "totalRevenue": "number",
      "totalProfit": "number",
      "productsSold": [
        {
          "product": "object",
          "quantity": "number",
          "revenue": "number"
        }
      ],
      "vouchersUsed": [
        {
          "voucher": "object",
          "usageCount": "number",
          "totalDiscount": "number"
        }
      ],
      "customerCount": {
        "new": "number",
        "total": "number"
      },
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 7.3. Báo cáo doanh thu
- **Route**: `/api/statistics/revenue`
- **Method**: GET
- **Request Params**:
  - `startDate` (date, required): Từ ngày
  - `endDate` (date, required): Đến ngày
  - `type` (string, optional): Loại báo cáo (DAILY/WEEKLY/MONTHLY/YEARLY)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "total": "number",
      "series": [
        {
          "date": "string",
          "revenue": "number"
        }
      ],
      "previousPeriod": {
        "total": "number",
        "change": "number",
        "percentChange": "number"
      }
    }
  }
  ```

### 7.4. Báo cáo sản phẩm bán chạy
- **Route**: `/api/statistics/top-products`
- **Method**: GET
- **Request Params**:
  - `startDate` (date, required): Từ ngày
  - `endDate` (date, required): Đến ngày
  - `limit` (number, optional): Số lượng sản phẩm
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "product": {
          "_id": "string",
          "name": "string",
          "brand": "object",
          "category": "object"
        },
        "totalQuantity": "number",
        "totalRevenue": "number"
      }
    ]
  }
  ```

### 7.5. Tạo thống kê ngày
- **Route**: `/api/statistics/generate-daily`
- **Method**: POST
- **Payload**:
  ```json
  {
    "date": "date"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "date": "date",
      "type": "DAILY",
      "totalOrders": "number",
      "totalRevenue": "number",
      "totalProfit": "number",
      "productsSold": [...],
      "vouchersUsed": [...],
      "customerCount": {...},
      "createdAt": "date"
    }
  }
  ```

## 8. Xác thực và Phân quyền

### 8.1. Đăng nhập
- **Route**: `/api/auth/login`
- **Method**: POST
- **Payload**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "role": "string",
      "token": "string"
    }
  }
  ```

### 8.2. Đăng xuất
- **Route**: `/api/auth/logout`
- **Method**: POST
- **Response**:
  ```json
  {
    "success": true,
    "message": "Đăng xuất thành công"
  }
  ```

### 8.3. Lấy thông tin người dùng từ token
- **Route**: `/api/auth/me`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string",
      "avatar": "string"
    }
  }
  ```

### 8.4. Làm mới token
- **Route**: `/api/auth/refresh-token`
- **Method**: POST
- **Payload**:
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "token": "string",
      "refreshToken": "string"
    }
  }
  ```

## 9. Quản lý Thuộc tính Sản phẩm

Các API quản lý thuộc tính sản phẩm bao gồm các thuộc tính như: Thương hiệu (Brand), Danh mục (Category), Chất liệu (Material), Màu sắc (Color), và Kích thước (Size).

### 9.1. Quản lý Thương hiệu (Brand)

#### 9.1.1. Lấy danh sách thương hiệu
- **Route**: `/api/attributes/brands`
- **Method**: GET
- **Request Params**:
  - `status` (string, optional): Lọc theo trạng thái (HOAT_DONG/INACTIVE)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "Nike",
        "status": "ACTIVE",
        "createdAt": "2023-06-22T14:25:32.952Z",
        "updatedAt": "2023-06-22T14:25:32.952Z"
      }
    ],
    "message": "Retrieved successfully"
  }
  ```

#### 9.1.2. Tạo thương hiệu mới
- **Route**: `/api/attributes/brands`
- **Method**: POST
- **Payload**:
  ```json
  {
    "name": "Nike",
    "status": "ACTIVE"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Nike",
      "status": "ACTIVE",
      "createdAt": "2023-06-22T14:25:32.952Z",
      "updatedAt": "2023-06-22T14:25:32.952Z"
    },
    "message": "Created successfully"
  }
  ```

#### 9.1.3. Lấy chi tiết thương hiệu
- **Route**: `/api/attributes/brands/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Nike",
      "status": "ACTIVE",
      "createdAt": "2023-06-22T14:25:32.952Z",
      "updatedAt": "2023-06-22T14:25:32.952Z"
    },
    "message": "Retrieved successfully"
  }
  ```

#### 9.1.4. Cập nhật thương hiệu
- **Route**: `/api/attributes/brands/:id`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "name": "Nike Updated",
    "status": "ACTIVE"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Nike Updated",
      "status": "ACTIVE",
      "createdAt": "2023-06-22T14:25:32.952Z",
      "updatedAt": "2023-06-22T15:30:45.123Z"
    },
    "message": "Updated successfully"
  }
  ```

#### 9.1.5. Xóa thương hiệu
- **Route**: `/api/attributes/brands/:id`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "message": "Deleted successfully"
  }
  ```

### 9.2. Quản lý Danh mục (Category)

Tương tự như quản lý thương hiệu, nhưng sử dụng endpoint `/api/attributes/categories`.

### 9.3. Quản lý Chất liệu (Material)

Tương tự như quản lý thương hiệu, nhưng sử dụng endpoint `/api/attributes/materials`.

### 9.4. Quản lý Màu sắc (Color)

#### 9.4.1. Lấy danh sách màu sắc
- **Route**: `/api/attributes/colors`
- **Method**: GET
- **Request Params**:
  - `status` (string, optional): Lọc theo trạng thái (HOAT_DONG/INACTIVE)

#### 9.4.2. Tạo màu sắc mới
- **Route**: `/api/attributes/colors`
- **Method**: POST
- **Payload**:
  ```json
  {
    "name": "Red",
    "code": "#FF0000",
    "status": "ACTIVE"
  }
  ```

#### 9.4.3. Lấy chi tiết màu sắc
- **Route**: `/api/attributes/colors/:id`
- **Method**: GET

#### 9.4.4. Cập nhật màu sắc
- **Route**: `/api/attributes/colors/:id`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "name": "Dark Red",
    "code": "#8B0000",
    "status": "ACTIVE"
  }
  ```

#### 9.4.5. Xóa màu sắc
- **Route**: `/api/attributes/colors/:id`
- **Method**: DELETE

### 9.5. Quản lý Kích thước (Size)

#### 9.5.1. Lấy danh sách kích thước
- **Route**: `/api/attributes/sizes`
- **Method**: GET
- **Request Params**:
  - `status` (string, optional): Lọc theo trạng thái (HOAT_DONG/INACTIVE)

#### 9.5.2. Tạo kích thước mới
- **Route**: `/api/attributes/sizes`
- **Method**: POST
- **Payload**:
  ```json
  {
    "value": 42,
    "status": "ACTIVE"
  }
  ```

#### 9.5.3. Lấy chi tiết kích thước
- **Route**: `/api/attributes/sizes/:id`
- **Method**: GET

#### 9.5.4. Cập nhật kích thước
- **Route**: `/api/attributes/sizes/:id`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "value": 43,
    "status": "ACTIVE"
  }
  ```

#### 9.5.5. Xóa kích thước
- **Route**: `/api/attributes/sizes/:id`
- **Method**: DELETE

