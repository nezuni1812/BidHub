-- ================================================
-- ENHANCED SEED DATA - PRODUCTS WITH RICH HTML DESCRIPTIONS
-- Run this after seed.sql to replace descriptions with rich HTML
-- ================================================

-- Update ĐIỆN THOẠI products with HTML descriptions
UPDATE products
SET
    description = '<h2>Thông tin sản phẩm</h2><p><strong>iPhone 15 Pro Max</strong> phiên bản <em>màu Titan Tự Nhiên</em> với dung lượng <strong>256GB</strong>. Đây là flagship cao cấp nhất của Apple năm 2023.</p><h3>Thông số kỹ thuật</h3><ul><li>Chip A17 Pro 3nm tiên tiến nhất</li><li>Camera chính 48MP, zoom quang 5x</li><li>Màn hình Super Retina XDR 6.7 inch</li><li>Khung viền Titanium siêu bền, siêu nhẹ</li><li>Pin cả ngày với sạc nhanh 20W</li></ul><h3>Tình trạng</h3><p>Máy như <strong>mới 99%</strong>, không trầy xước. Pin health <strong>98%</strong>, sử dụng cẩn thận. <em>Bảo hành Apple chính hãng</em> còn đến tháng 6/2025.</p><blockquote>Fullbox nguyên seal, đầy đủ phụ kiện gốc từ Apple</blockquote>'
WHERE
    id = 1;

UPDATE products
SET
    description = '<h2>Samsung Galaxy S24 Ultra - Flagship Android 2024</h2><p>Điện thoại cao cấp nhất của Samsung với thiết kế <strong>Titanium Gray</strong> sang trọng. Bộ nhớ <strong>512GB</strong> siêu lớn.</p><h3>Điểm nổi bật</h3><ul><li><strong>Snapdragon 8 Gen 3 for Galaxy</strong> - chip mạnh nhất</li><li>Màn hình <strong>Dynamic AMOLED 6.8 inch</strong> 120Hz</li><li>Camera <strong>200MP</strong> với AI xử lý ảnh</li><li><strong>S-Pen</strong> tích hợp trong thân máy</li><li>Pin 5000mAh, sạc nhanh 45W</li></ul><h3>Phụ kiện kèm theo</h3><ol><li>Hộp nguyên seal chưa mở</li><li>Cáp USB-C to C</li><li>Que lấy sim + sách hướng dẫn</li><li>S-Pen đi kèm</li></ol><blockquote>Bảo hành chính hãng Samsung 12 tháng tại tất cả TTBH toàn quốc</blockquote>'
WHERE
    id = 16;

UPDATE products
SET
    description = '<h2>iPhone 14 Pro - Deep Purple Limited Edition</h2><p>Màu <em>Deep Purple</em> độc quyền, chỉ có ở series Pro. Dung lượng <strong>256GB</strong> đủ dùng.</p><h3>Tính năng độc đáo</h3><ul><li><strong>Dynamic Island</strong> - công nghệ mới nhất của Apple</li><li>Camera <strong>48MP</strong> lần đầu xuất hiện</li><li>Màn hình <strong>Always-On Display</strong></li><li>Chip A16 Bionic mạnh mẽ</li><li>ProMotion 120Hz mượt mà</li></ul><h3>Trạng thái máy</h3><p>Máy <strong>like new 98%</strong>, không có vết trầy xước. Pin health <strong>100%</strong> nhờ có <em>Apple Care+</em> nên sử dụng rất cẩn thận.</p><blockquote>Fullbox đầy đủ, Apple Care+ còn 8 tháng (trị giá 3 triệu)</blockquote>'
WHERE
    id = 17;

UPDATE products
SET
    description = '<h2>Xiaomi 14 Ultra - Photography Flagship</h2><p>Flagship cao cấp nhất của Xiaomi với hệ thống camera <strong>Leica</strong> đỉnh cao. <em>16GB RAM + 512GB ROM</em>.</p><h3>Hệ thống camera Leica</h3><ul><li>Camera chính <strong>50MP Leica Vario-Summicron</strong></li><li>3 camera phụ đều 50MP</li><li>Zoom quang 3.2x + 5x</li><li>Chế độ Leica Authentic Look</li><li>Quay video 8K@24fps</li></ul><h3>Hiệu năng khủng</h3><ul><li>Snapdragon 8 Gen 3</li><li>16GB LPDDR5X RAM</li><li>512GB UFS 4.0</li><li>Tản nhiệt vapor chamber lớn</li></ul><blockquote>Máy mới nguyên seal chưa kích hoạt, bảo hành Xiaomi 18 tháng</blockquote>'
WHERE
    id = 18;

UPDATE products
SET
    description = '<h2>Google Pixel 8 Pro - AI Camera King</h2><p>Điện thoại với <strong>AI camera</strong> tốt nhất thị trường. Màu <em>Porcelain</em> sang trọng, dung lượng <strong>256GB</strong>.</p><h3>Camera AI đỉnh cao</h3><ul><li><strong>Magic Eraser</strong> - xóa vật thể không mong muốn</li><li><strong>Best Take</strong> - chọn biểu cảm đẹp nhất</li><li><strong>Night Sight</strong> - chụp đêm siêu sáng</li><li>Video Boost với AI xử lý</li><li>Astrophotography mode</li></ul><h3>Chip Google Tensor G3</h3><ul><li>Xử lý AI tốc độ cao</li><li>Bảo mật Titan M2</li><li>Tiết kiệm pin thông minh</li></ul><blockquote>Hỗ trợ cập nhật Android 7 năm! Bảo hành Google 24 tháng</blockquote>'
WHERE
    id = 19;

-- Update LAPTOP products
UPDATE products
SET
    description = '<h2>MacBook Pro M3 Pro - Máy trạm di động</h2><p>MacBook Pro 14 inch với chip <strong>M3 Pro</strong> thế hệ mới nhất. Màu <em>Space Black</em> cao cấp, sang trọng.</p><h3>Cấu hình mạnh mẽ</h3><ul><li>Chip <strong>M3 Pro 12-core CPU</strong></li><li>GPU 18-core mạnh mẽ</li><li><strong>18GB Unified Memory</strong></li><li>SSD 512GB tốc độ cao</li><li>Neural Engine 16-core</li></ul><h3>Màn hình Liquid Retina XDR</h3><ul><li>14.2 inch độ phân giải 3024x1964</li><li>Độ sáng <strong>1000 nits</strong> SDR, 1600 nits HDR</li><li>ProMotion 120Hz</li><li>True Tone, P3 wide color</li></ul><h3>Tình trạng</h3><p>Máy mới <strong>99%</strong>, sạc chỉ <strong>15 cycle</strong>. Fullbox nguyên bản, bảo hành Apple chính hãng.</p>'
WHERE
    id = 3;

UPDATE products
SET
    description = '<h2>Dell XPS 15 9530 - Premium Windows Laptop</h2><p>Laptop cao cấp nhất của Dell với thiết kế kim loại nguyên khối sang trọng.</p><h3>Hiệu năng cao cấp</h3><ul><li>Intel Core <strong>i7-13700H</strong> (14 cores, 20 threads)</li><li><strong>32GB DDR5</strong> 4800MHz RAM</li><li>SSD <strong>1TB PCIe Gen 4</strong></li><li>NVIDIA GeForce <strong>RTX 4050 6GB</strong></li><li>WiFi 6E + Bluetooth 5.3</li></ul><h3>Màn hình OLED 3.5K</h3><ul><li>15.6 inch <strong>3456x2160</strong> OLED</li><li>100% DCI-P3, Delta E &lt; 2</li><li>400 nits brightness</li><li>Touch screen 10-point</li></ul><blockquote>Mới 99%, bảo hành Dell Premium Support 20 tháng</blockquote>'
WHERE
    id = 24;

UPDATE products
SET
    description = '<h2>MacBook Air M2 15 inch - Siêu mỏng nhẹ</h2><p>MacBook Air lớn nhất với màn hình <strong>15.3 inch</strong>. Màu <em>Midnight</em> độc đáo, vân tay không bám dính.</p><h3>Chip Apple M2</h3><ul><li>CPU 8-core (4 performance + 4 efficiency)</li><li>GPU 10-core</li><li><strong>16GB Unified Memory</strong></li><li>SSD <strong>512GB</strong></li><li>Neural Engine 16-core</li></ul><h3>Thiết kế hoàn hảo</h3><ul><li>Độ mỏng chỉ <strong>11.5mm</strong></li><li>Trọng lượng <strong>1.51kg</strong></li><li>Không quạt - hoàn toàn im lặng</li><li>Pin 18 giờ sử dụng web</li></ul><h3>Màn hình Liquid Retina</h3><ul><li>15.3 inch 2880x1864</li><li>500 nits brightness</li><li>1 tỷ màu, P3 wide color</li></ul><blockquote>Mới 100% chưa active, fullbox, bảo hành Apple 12 tháng</blockquote>'
WHERE
    id = 25;

UPDATE products
SET
    description = '<h2>ASUS ROG Zephyrus G16 - Gaming Beast</h2><p>Laptop gaming cao cấp nhất của ASUS ROG với thiết kế mỏng nhẹ nhưng cực kỳ mạnh mẽ.</p><h3>Sức mạnh khủng khiếp</h3><ul><li>Intel Core Ultra 9 <strong>185H</strong></li><li><strong>32GB DDR5</strong> 5600MHz</li><li>SSD <strong>1TB PCIe Gen 4</strong></li><li>NVIDIA GeForce <strong>RTX 4070 8GB</strong></li><li>MUX Switch + Advanced Optimus</li></ul><h3>Màn hình gaming đỉnh cao</h3><ul><li>16 inch <strong>2560x1600 WQXGA</strong></li><li>Tần số quét <strong>240Hz</strong></li><li>Response time 3ms</li><li>G-Sync + Dolby Vision</li><li>100% DCI-P3 color gamut</li></ul><h3>Tản nhiệt ROG Intelligent Cooling</h3><ul><li>Tri-Fan system với Arc Flow Fans</li><li>Liquid metal thermal compound</li><li>Hoạt động ổn định suốt marathon gaming</li></ul>'
WHERE
    id = 26;

-- Update Ô TÔ products
UPDATE products
SET
    description = '<h2>Mercedes-Benz S450 Luxury 2023</h2><p>Sedan hạng sang đỉnh cao với <strong>biển số tứ quý</strong> cực đẹp. Màu đen huyền bí, sang trọng.</p><h3>Thông số xe</h3><ul><li>Động cơ: <strong>3.0L V6 Turbo</strong></li><li>Công suất: <strong>367 mã lực</strong></li><li>Hộp số: <strong>9G-Tronic</strong> 9 cấp</li><li>Dẫn động: <strong>Rear-wheel drive</strong></li><li>Số km đã đi: <strong>8,000 km</strong></li></ul><h3>Trang bị cao cấp</h3><ul><li><strong>Cửa hít điện</strong> 4 cửa + cốp</li><li>Ghế <strong>massage 10 chế độ</strong></li><li>Âm thanh <strong>Burmester 3D</strong> 26 loa</li><li>Màn hình <strong>MBUX</strong> 12.8 inch</li><li>Cửa sổ trời toàn cảnh</li><li>Phanh tay điện tử + Auto Hold</li></ul><h3>An toàn</h3><ul><li>7 túi khí</li><li>Hệ thống <strong>ADAS</strong> đầy đủ</li><li>Camera 360 độ</li><li>Cảnh báo điểm mù</li><li>Hỗ trợ đỗ xe tự động</li></ul><blockquote>Xe 1 chủ từ đầu, bảo dưỡng định kỳ tại hãng, hồ sơ đầy đủ</blockquote>'
WHERE
    id = 7;

UPDATE products
SET
    description = '<h2>Toyota Camry 2.5Q 2023 - Sedan hạng D bán chạy nhất</h2><p>Toyota Camry phiên bản <strong>2.5Q cao cấp</strong> màu <em>trắng ngọc trai</em> sang trọng. Xe lướt <strong>12,000km</strong>.</p><h3>Động cơ & Vận hành</h3><ul><li>Động cơ: <strong>2.5L 4 xy-lanh</strong></li><li>Công suất: <strong>181 mã lực</strong></li><li>Hộp số: <strong>CVT</strong> 8 cấp mô phỏng</li><li>Mức tiêu thụ: <strong>6.5L/100km</strong></li></ul><h3>Trang bị tiện nghi</h3><ul><li><strong>Cửa hít</strong> êm ái</li><li>Ghế da cao cấp chỉnh điện</li><li>Cửa sổ trời <strong>panorama</strong></li><li>Camera <strong>360 độ</strong></li><li>Màn hình <strong>9 inch</strong> Apple CarPlay</li><li>Đề nổ từ xa thông minh</li></ul><h3>An toàn Toyota Safety Sense</h3><ul><li>Cảnh báo tiền va chạm</li><li>Hỗ trợ giữ làn đường</li><li>Kiểm soát hành trình thích ứng</li><li>Cảnh báo phương tiện cắt ngang</li></ul><blockquote>Bảo hành Toyota 28 tháng, bảo dưỡng miễn phí 1 năm</blockquote>'
WHERE
    id = 32;

UPDATE products
SET
    description = '<h2>Honda CR-V L 2024 - 7 chỗ Hybrid tiết kiệm</h2><p>Honda CR-V phiên bản <strong>cao cấp nhất L</strong> với động cơ <em>Hybrid tiết kiệm nhiên liệu</em>. Màu đen huyền bí, 7 chỗ rộng rãi.</p><h3>Công nghệ Hybrid tiên tiến</h3><ul><li>Động cơ xăng <strong>2.0L</strong> + Motor điện</li><li>Công suất tổng: <strong>204 mã lực</strong></li><li>Mức tiêu thụ chỉ <strong>5.3L/100km</strong></li><li>Hộp số <strong>e-CVT</strong></li><li>Chế độ lái: Eco, Normal, Sport</li></ul><h3>Honda SENSING cao cấp</h3><ul><li>Phanh giảm thiểu va chạm</li><li>Kiểm soát hành trình thích ứng</li><li>Hỗ trợ giữ làn đường</li><li>Đèn pha thích ứng tự động</li><li>Cảnh báo phương tiện cắt ngang</li></ul><h3>Nội thất 7 chỗ cao cấp</h3><ul><li>Ghế da <strong>thật</strong> cao cấp</li><li>Hàng ghế 2 chỉnh điện + sưởi</li><li>Cửa sổ trời <strong>toàn cảnh</strong></li><li>Màn hình <strong>9 inch</strong> Honda Connect</li><li>Âm thanh <strong>Bose 12 loa</strong></li></ul><blockquote>Xe mới 100% chưa đăng ký, 0 km. Bảo hành Honda 3 năm không giới hạn km</blockquote>'
WHERE
    id = 33;

UPDATE products
SET
    description = '<h2>BMW 530i M Sport 2022 - The Ultimate Driving Machine</h2><p>BMW 5-Series thế hệ G30 với gói <strong>M Sport</strong> thể thao. Màu <em>Phytonic Blue</em> độc đáo, hiếm có.</p><h3>Động cơ mạnh mẽ</h3><ul><li>Động cơ: <strong>2.0L TwinPower Turbo</strong></li><li>Công suất: <strong>252 mã lực</strong></li><li>Mô-men xoắn: <strong>350 Nm</strong></li><li>0-100km/h: <strong>6.2 giây</strong></li><li>Hộp số <strong>Steptronic 8 cấp</strong></li></ul><h3>Gói M Sport Performance</h3><ul><li>La-zăng M Sport <strong>19 inch</strong></li><li>Ghế thể thao M chỉnh điện</li><li>Vô lăng M Sport da Nappa</li><li>Phanh M Sport với calipers xanh</li><li>Ống xả M Sport âm thanh đầm</li></ul><h3>Công nghệ BMW</h3><ul><li><strong>iDrive 7.0</strong> màn hình kép 12.3 inch</li><li><strong>Head-Up Display</strong> màu</li><li>Âm thanh <strong>Harman Kardon</strong></li><li>Driving Assistant Professional</li><li>Parking Assistant Plus</li></ul><blockquote>Xe lướt 18,000km, 1 đời chủ, bảo dưỡng định kỳ BMW</blockquote>'
WHERE
    id = 35;

-- Reset sequence
SELECT 'Enhanced descriptions updated successfully!' as status;