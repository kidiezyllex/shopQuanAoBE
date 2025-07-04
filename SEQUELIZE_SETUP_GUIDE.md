# Hướng dẫn sử dụng Sequelize - Chuyển đổi từ MongoDB sang MySQL

## 🎯 Tổng quan
Dự án đã được cài đặt và cấu hình hoàn chỉnh Sequelize ORM để chuyển đổi từ MongoDB sang MySQL.

## 📦 Các package đã cài đặt
- `sequelize`: ORM chính
- `mysql2`: Driver MySQL
- `sequelize-cli`: CLI tools cho migration và seeding

## 🗂️ Cấu trúc thư mục
```
├── config/
│   └── database.json          # Cấu hình database
├── src/
│   └── sequelize-models/      # Sequelize models
│       ├── index.cjs          # File khởi tạo models
│       ├── account.cjs        # Model Account
│       ├── accountaddress.cjs # Model AccountAddress
│       ├── brand.cjs          # Model Brand
│       ├── category.cjs       # Model Category
│       ├── color.cjs          # Model Color
│       ├── material.cjs       # Model Material
│       ├── order.cjs          # Model Order
│       ├── orderitem.cjs      # Model OrderItem
│       ├── product.cjs        # Model Product
│       ├── productvariant.cjs # Model ProductVariant
│       ├── productvariantimage.cjs # Model ProductVariantImage
│       ├── size.cjs           # Model Size
│       └── voucher.cjs        # Model Voucher
├── migrations/                # Migration files
└── .sequelizerc              # Cấu hình Sequelize CLI
```

## 🗄️ Database Schema
Đã tạo các bảng sau trong MySQL:

### Bảng cơ bản
- `brands` - Thương hiệu
- `categories` - Danh mục
- `materials` - Chất liệu
- `colors` - Màu sắc
- `sizes` - Kích thước

### Bảng chính
- `accounts` - Tài khoản người dùng
- `account_addresses` - Địa chỉ của tài khoản
- `products` - Sản phẩm
- `product_variants` - Biến thể sản phẩm (màu + size)
- `product_variant_images` - Hình ảnh biến thể
- `vouchers` - Voucher giảm giá
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng

## 🔧 Cấu hình Database
File `config/database.json`:
```json
{
  "development": {
    "username": "root",
    "password": null,
    "database": "allwear2DB",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "port": 3306
  }
}
```

## 🚀 Cách sử dụng

### 1. Import models
```javascript
const db = require('./src/sequelize-models/index.cjs');
```

### 2. Sử dụng models
```javascript
// Tạo brand mới
const brand = await db.Brand.create({
  name: 'Nike',
  status: 'ACTIVE'
});

// Query với associations
const product = await db.Product.findOne({
  where: { id: 1 },
  include: [
    { model: db.Brand, as: 'brand' },
    { model: db.Category, as: 'category' },
    {
      model: db.ProductVariant,
      as: 'variants',
      include: [
        { model: db.Color, as: 'color' },
        { model: db.Size, as: 'size' }
      ]
    }
  ]
});
```

### 3. Chạy migrations
```bash
npx sequelize-cli db:migrate
```

### 4. Rollback migrations
```bash
npx sequelize-cli db:migrate:undo
```

## 🔄 So sánh MongoDB vs Sequelize

### MongoDB (Cũ)
```javascript
import Account from './models/account.model.js';

const account = new Account({
  fullName: 'Nguyễn Văn A',
  email: 'test@example.com'
});
await account.save();
```

### Sequelize (Mới)
```javascript
const db = require('./src/sequelize-models/index.cjs');

const account = await db.Account.create({
  fullName: 'Nguyễn Văn A',
  email: 'test@example.com'
});
```

## 🎨 Tính năng đặc biệt

### 1. Auto-generate codes
- Account: `CUS0001XX` (Customer) hoặc `ADM0001XX` (Admin)
- Product: `PRD000001`
- Order: `DH2412XXXX`

### 2. Password hashing
Tự động hash password khi tạo/cập nhật account:
```javascript
const account = await db.Account.create({
  password: '123456' // Sẽ được hash tự động
});

// Kiểm tra password
const isValid = await account.validatePassword('123456');
```

### 3. Associations
Tất cả relationships đã được định nghĩa:
- Product belongsTo Brand, Category, Material
- Product hasMany ProductVariant
- Order belongsTo Account (customer, staff)
- Order hasMany OrderItem

## 🧪 Test
Chạy file test để kiểm tra:
```bash
node test-sequelize.cjs
```

## 📝 Lưu ý quan trọng

1. **File extensions**: Do dự án sử dụng ES modules, tất cả Sequelize files phải có extension `.cjs`

2. **Database connection**: Đảm bảo MySQL server đang chạy trên localhost:3306

3. **Migration order**: Các migration được đánh số theo thứ tự dependency

4. **Enum values**: Tất cả ENUM values đã được định nghĩa chính xác theo MongoDB schema

## 🔄 Migration từ MongoDB
Để migrate data từ MongoDB sang MySQL:

1. Export data từ MongoDB
2. Transform data format
3. Import vào MySQL thông qua Sequelize

