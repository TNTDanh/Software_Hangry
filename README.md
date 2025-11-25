# HANGRY - DANHPHUOCxFOODFAST

Hangry là hệ sinh thái đặt đồ ăn đa kênh (MERN + Expo). Người dùng duyệt menu, thêm giỏ, thanh toán (Stripe/COD), mã khuyến mãi, theo dõi đơn - đơn được giao theo phương thức truyền thống bằng Tài Xế, nhưng kết hợp phương thức mới bằng Drone; đội vận hành có portal quản lý món/đơn, và console quản trị người dùng.

## Mục lục
- [Live Link](#live-link)
- [Tính năng](#tính-năng)
- [Kiến trúc & Tech Stack](#kiến-trúc--tech-stack)
- [Cài đặt](#cài-đặt)
- [Biến môi trường](#biến-môi-trường)
- [Chạy dự án](#chạy-dự-án)
- [CI](#ci)
- [Quy tắc nhánh/PR](#quy-tắc-nhánhpr)
- [API chính (tóm tắt)](#api-chính-tóm-tắt)
- [Đóng Góp](#đóng-góp)
- [License](#license)

## Live Link (Demo)
- Web khách hàng: https://hangry-frontend.onrender.com  

## Tính năng
- Đăng ký/đăng nhập JWT, phân quyền user/admin.
- Duyệt danh mục, đặt món từ nhiều nhà hàng, thêm/giảm giỏ, áp mã khuyến mãi, thanh toán Stripe hoặc COD, theo dõi trạng thái đơn.
- Portal admin: thêm món (upload ảnh), duyệt menu, cập nhật trạng thái đơn.
- User console (users-admin): quản lý người dùng (lọc, khóa/mở, đổi role, xóa).
- Ứng dụng di động Expo (tabs: Home, Cart, Orders, Profile).

## Kiến trúc & Tech Stack
- Backend: Node.js/Express, MongoDB, JWT, Stripe.
- Frontend web: React + Vite.
- Admin portal: React + Vite.
- Users-admin console: React + Vite.
- Mobile: React Native (Expo).
- CI: GitHub Actions (`.github/workflows/ci.yml`).

## Cài đặt
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
- Backend: `backend/.env`: `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `FRONTEND_URL`, `STRIPE_SECRET_KEY`, và `khóa Cloudinary/Uploads` (nếu dùng).
- Frontend: `frontend/.env`, `admin/.env`, `users-admin/.env`: `VITE_API_URL=http://localhost:4000`.
- Mobile: cập nhật `mobile/src/api/client.ts` & `mobile/src/until/image.ts` với `API_URL` phù hợp (VD: `http://10.0.2.2:4000` trên Android emulator).

### Chạy dự án
| Module        | Lệnh                         |
| ------------- | --------------------------- |
| Backend       | `cd backend && npm run server` |
| Web khách     | `cd frontend && npm run dev`   |
| Admin portal  | `cd admin && npm run dev`      |
| User console  | `cd users-admin && npm run dev`|
| Mobile (Expo) | `cd mobile && npx expo start`  |

### CI
- Workflow: `.github/workflows/ci.yml`
- Trigger: `push/PR lên dev và main.`
- Bước: checkout → setup Node 20 → install & build frontend/admin/users-admin, install + lint mobile, install backend.

### Quy tắc nhánh/PR
- Nhánh chính: main (default). Nhánh phát triển: dev.
- Branch protection: yêu cầu PR + CI pass, chặn force-push (áp dụng cho main và dev).
- Merge: dùng merge commit để giữ lịch sử theo module; có thể squash nếu muốn gọn.

### API chính (tóm tắt)
- **User:** POST /api/user/register, POST /api/user/login, GET /api/user/list, POST /api/user/update, POST /api/user/remove
- **Food:** POST /api/food/add, GET /api/food/list, POST /api/food/remove
- **Cart:** POST /api/cart/add, /remove, /get
- **Order:** POST /api/order/place, /place-cod, /verify, /userorders, GET /api/order/list, POST /api/order/status
- (Các API mở rộng khác như city/promotion/restaurant/review/support… xem code trong backend/routes/*)

## Đóng Góp
1. Fork repo & tạo nhánh `feat/<ten>`.
2. Commit, push, mở Pull Request về nhánh `dev`.

## License
Dự án phát hành theo [MIT](LICENSE).
