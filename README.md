# Bảo tàng số “Dòng chảy Đổi mới” · 1996–2006


## Giới thiệu

Trải nghiệm bảo tàng 3D trình bày tiến trình thay đổi trọng tâm phát triển của Việt Nam từ Đại hội VIII (1996), qua giai đoạn triển khai CNH–HĐH và Đại hội IX, đến Đại hội X, WTO và APEC 14 (11/2006).

- 10 hồ sơ hiện vật theo tuyến thời gian, gắn với nội dung P2–P6 trong `GROUP_REPORT`.
- Ảnh tư liệu TTXVN được lưu cục bộ; mỗi hiện vật có caption, credit và liên kết bài nguồn.
- Nội dung lịch sử đối chiếu `VNR202-2019.pdf`, trọng tâm PDF tr. 141–156, 166–167 và 196; mã kiểm chứng SV-01 đến SV-17.
- Màn hình máy tính là desktop tương tác mở bằng phím `E`; nhạc nền là “Hello Vietnam” từ tệp được chủ dự án cung cấp và xác nhận quyền sử dụng.
- Chế độ tham quan trực tuyến đồng bộ vị trí và hướng di chuyển giữa các khách trong cùng phòng; khách khác hiện thành nhân vật đất sét trắng được dựng bằng hình học Three.js.
- Không sử dụng ảnh tạo bởi AI.

Website dùng `three.js`; mô hình không gian và va chạm được tải từ các tệp `glb`.

## Điều khiển

Di chuyển: `W`/`S`/`A`/`D`

Điện thoại: cần điều khiển ảo

Nhảy: `Space`

Góc nhìn: giữ và kéo chuột phải

Tương tác hiện vật: chuột trái

Sử dụng máy tính: đứng gần màn hình và nhấn `E`; nhấn `Esc` để thoát

## Tham quan cùng nhau

Sau khi bấm “Bước vào bảo tàng”, trình duyệt tự kết nối vào phòng trực tuyến. Người mở cùng một địa chỉ sẽ thấy vị trí và chuyển động của nhau; chấm xanh ở góc phải cho biết tổng số khách hiện diện.

- Phòng chung mặc định: URL của website như bình thường.
- Phòng riêng: thêm `?phong=ten-phong` vào URL và gửi đúng liên kết đó cho người tham gia, ví dụ `https://baotoancuaquakhu.vercel.app/?phong=lop-vnr202`.
- Kênh chính dùng Supabase Realtime: Presence đồng bộ người đang online, Broadcast truyền vị trí và chat qua WebSocket trung tâm. WebRTC chỉ được dùng làm phương án dự phòng khi chưa cấu hình Supabase.
- Ứng dụng không yêu cầu tài khoản; mỗi tab chỉ gửi vị trí, hướng di chuyển và một tên tạm như `Khách 328` cho các máy trong phòng.
- Chat trong phòng chỉ được giữ trong bộ nhớ của tab (tối đa 80 tin gần nhất), không ghi cơ sở dữ liệu và không khôi phục lịch sử sau khi refresh hoặc mở lại website.
- Không có bảng database cho multiplayer và không lưu lịch sử chat. Presence/Broadcast chỉ giữ trạng thái của phiên đang kết nối.

### Cấu hình Supabase Realtime

1. Tạo một Supabase project và mở mục **Connect**.
2. Sao chép **Project URL** và **Publishable key**. Không dùng Secret key hoặc `service_role` ở frontend.
3. Tạo `.env.local` theo `.env.example` để chạy local.
4. Trên Vercel, thêm hai biến cho Production và Preview:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Redeploy website. Chấm trạng thái xanh nghĩa là đang dùng kênh trung tâm; trạng thái vàng “Dự phòng” nghĩa là deployment chưa nhận được hai biến trên.

## Project Structure
```text
├── src                        # Source code
│   ├── assets                 # Assets (audio, textures, and models)
│   │── audio                  # Audio class (creates positional audio)
|   │── character              # Character class (controls the player model)
|   │── controlManage          # Input class (tracks keyboard or virtual joystick state)
|   │── core                   # Core classes (camera, renderer, scene, and more)
|   │── css3DRenderer          # Combines DOM elements with WebGL (renders the computer-screen iframe)
|   │── environment            # Scene class (map, gallery textures, and floor reflections)
|   │── lib                    # three.js extensions
|   │── loader                 # Loader management for GLB, textures, audio, and more
|   │── multiplayer            # Realtime room, position sync, and procedural visitor avatars
|   │── rayCasterControls      # Raycasting interactions between the character and artwork frames
|   │── ui                     # UI controls for loading, details, and the virtual joystick
|   │── utils                  # Utility functions
|   |    │── Emitter.ts        # Event dispatcher
|   |    └── typeAssert.ts     # Type-narrowing utilities
|   │── world                  # Manages the environment, character, interactions, and audio
|   │── main.ts                # Application entry point
|   └── Constants.ts           # Model, texture, media, and event-name constants
```

## Nguồn dự án

Dự án này được phát triển từ repository [`Steve245270533/gallery`](https://github.com/Steve245270533/gallery). Mã nguồn gốc được phát hành theo giấy phép GPL-3.0; nội dung giấy phép tiếp tục được giữ tại [`LICENSE`](./LICENSE).

Phiên bản hiện tại đã được thiết kế lại thành bảo tàng lịch sử số Việt Nam giai đoạn 1996–2006, bổ sung tuyến nội dung P2–P6, tư liệu kiểm chứng, giao diện tiếng Việt và các cơ chế tương tác riêng.

## 🎇 Features

1. High-performance collision detection:

   Because this type of project has limited need for a full physics engine, it uses a high-performance dynamic collision-detection system with no physics-engine dependency. It performs several times better than the `Octree` approach in the official `three.js` examples.

2. Gallery interactions:

   Raycasting detects objects and triggers interactive effects.

3. Positional audio:

   Positional audio simulates real-world sound propagation, giving the music a stronger sense of space and improving the viewing experience.

## Running the Project
Yêu cầu Node.js 24 trở lên.

To setup a dev environment:
```text
# Clone the repository

# Install dependencies
npm i

# Run the local dev server
npm run dev
```
To serve a production build:
```text
# Install dependencies if not already done - 'npi i'

# Build for production
npm run build
```

## Deploy Vercel

Vercel phải deploy từ nhánh `master`, là nhánh chứa mã nguồn và `package.json`. Không chọn `gh-pages`: nhánh đó chỉ là kết quả build dành cho GitHub Pages.

Thiết lập dự án Vercel:

- Production Branch: `master`
- Framework Preset: `Vite`
- Root Directory: để trống
- Build và Output Directory: dùng cấu hình trong `vercel.json`
