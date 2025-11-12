# Hangry

Hangry là hệ sinh thái đặt đồ ăn đa kênh xây trên MERN + Expo. Người dùng có thể duyệt menu, thêm giỏ, thanh toán (Stripe/COD) và theo dõi đơn; đội vận hành có portal để quản lý món, đơn và người dùng.

## Tech Stack
MongoDB · Express.js · React (Vite) · Node.js · React Native (Expo) · Stripe · Cloudinary/Uploads · JWT

## Mục Lục
- [Live Link](#live-link)
- [Tính Năng](#tính-năng)
- [Tech Stack](#tech-stack)
- [Cài Đặt](#cài-đặt)
- [Sử Dụng](#sử-dụng)
- [API Chính](#api-chính)
- [Đóng Góp](#đóng-góp)
- [License](#license)

## Live Link
- Web khách hàng: https://hangry-frontend.onrender.com  
- Backend mẫu: https://hangry-backend.onrender.com

## Tính Năng
- Đăng ký/đăng nhập JWT, phân quyền user/admin.
- Duyệt danh mục, thêm/giảm giỏ, thanh toán Stripe hoặc COD.
- Portal admin thêm món (upload ảnh), duyệt menu, cập nhật trạng thái đơn.
- Console quản lý người dùng (lọc, khóa/mở, đổi role, xóa).
- Ứng dụng di động Expo tabs: Home, Cart, Orders, Profile.

## Cài Đặt
```bash
git clone https://github.com/TNTDanh/Software_Hangry.git
cd Software_Hangry

cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
cd ../users-admin && npm install
cd ../mobile && npm install
```

### Biến môi trường
- `backend/.env`: `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `FRONTEND_URL`, `STRIPE_SECRET_KEY`, các khóa Cloudinary (nếu dùng).
- `frontend/.env`, `admin/.env`, `users-admin/.env`: `VITE_API_URL=http://localhost:4000`.
- `mobile/src/api/client.ts` & `mobile/src/until/image.ts`: cập nhật `API_URL` phù hợp (VD: `http://10.0.2.2:4000` trên Android emulator).

### Chạy dự án
| Module        | Lệnh                         |
| ------------- | --------------------------- |
| Backend       | `cd backend && npm run server` |
| Web khách     | `cd frontend && npm run dev`   |
| Admin portal  | `cd admin && npm run dev`      |
| User console  | `cd users-admin && npm run dev`|
| Mobile (Expo) | `cd mobile && npx expo start`  |

## Sử Dụng
1. Mở web/app → đăng ký/đăng nhập.
2. Duyệt menu, lọc danh mục, thêm món vào giỏ.
3. Đặt đơn (Stripe redirect hoặc COD) và theo dõi trạng thái.
4. Admin dùng portal để thêm món, chỉnh đơn; console để quản lý người dùng.

## API Chính
- **User:** `POST /api/user/register`, `POST /api/user/login`, `GET /api/user/list`, `POST /api/user/update`, `POST /api/user/remove`.
- **Food:** `POST /api/food/add`, `GET /api/food/list`, `POST /api/food/remove`.
- **Cart:** `POST /api/cart/add`, `/remove`, `/get`.
- **Order:** `POST /api/order/place`, `/place-cod`, `/verify`, `/userorders`, `GET /api/order/list`, `POST /api/order/status`.

## Đóng Góp
1. Fork repo & tạo nhánh `feat/<ten>`.
2. Commit, push, mở Pull Request về nhánh `dev`.

## License
Dự án phát hành theo [MIT](LICENSE).
