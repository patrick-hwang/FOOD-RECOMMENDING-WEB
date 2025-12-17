DETERMINING_CRITERIA = [
    # 1. Đặc điểm (Characteristics): Temp, Sweet, Spicy, Fatty, Salty, Sour
    [
        "lạnh như băng", "lạnh", "mát", "nguội", "ấm", "nóng", "sôi/rất nóng",
        "không ngọt", "ít ngọt", "vừa ngọt", "ngọt đậm", "rất ngọt",
        "không cay", "cay nhẹ", "cay vừa", "cay nhiều", "rất cay",
        "không béo", "béo nhẹ", "béo vừa", "béo đậm",
        "nhạt", "hơi mặn", "mặn vừa", "mặn đậm",
        "không chua", "chua nhẹ", "chua vừa", "chua đậm"
    ],

    # 2. Món ăn/uống (Dishes/Drinks): Noodles, Rice/Sticky, Cakes, Water/Dry dishes, Drinks, Desserts
    [
        "bún", "phở", "hủ tiếu", "mì sợi", "bánh canh bột gạo", "bánh đa", "miến dong", "miến/bún tàu", # Sợi
        "cơm", "xôi", "cốm", "bắp", "nếp hấp", "chè nếp", "bánh nếp", # Món nếp / Món rời
        "bánh xèo", "bánh bèo", "bánh căn", "bánh cuốn", "bánh ướt", "bánh hỏi", "bánh bò", "bánh đúc", # Bánh bột gạo
        "bánh mì", "bánh bao", "bánh quẩy", "bánh tiêu", "bánh su kem", "bánh bông lan", "donut", # Bánh bột mì
        "súp", "lẩu", "cháo", "cà ri", "hầm", # Món nước
        "xào", "chiên", "nướng", "trộn", "hấp", "kho", "rang", "quay", "luộc", # Món khô
        "cà phê", "trà sữa", "nước ép/ sinh tố", "có cồn", "nước có ga", "trà", # Thức uống
        "chè", "kem tươi", "kem cheese", "sữa chua", "trân châu", "thạch", "kem trứng", "flan" # Đồ ngọt
    ],

    # 3. Nguyên liệu (Ingredients): Herbs, Meat, Seafood, Veggie, Fruit, Dairy, Eggs, Nuts
    [
        "sả", "hồi", "quế", "gừng", "lá dứa", "vani", "matcha", # Thảo mộc
        "thịt bò", "thịt heo", "thịt trâu", "thịt dê", "thịt cừu", # Gia súc
        "thịt gà", "thịt vịt", "thịt ngan", "thịt ngỗng", "thịt chim cút", # Gia cầm
        "tôm", "mực", "cá", "nghêu", "sò", "ốc", "cua", "bào ngư", "trứng cá", # Hải sản
        "rau củ", "đậu hũ", "nấm", "chả chay", # Món chay
        "họ cam", "dâu/phúc bồn tử", "đào", "vải/nhãn", "xoài", "cóc", "bơ", "táo", "mít", "sầu riêng", # Trái cây
        "sữa", # Sữa
        "trứng gà", "trứng cút", # Trứng
        "nước cốt dừa", "dừa", # Dừa
        "cà phê", "đậu phộng", "đậu đen", "đậu đỏ", "đậu ván", "cacao", "hạt sen", # Đậu - Hạt
        "rau má", "gạo" # Khác / Tinh bột
    ],

    # 4. Origin (Vùng miền): North, Central, West, South, Highland, Foreign
    [
        "Hà Nội", "Hải Phòng", "Tây Bắc", # Miền Bắc
        "Phú Yên", "Huế", "Quảng Ngãi", "Đà Nẵng", "Quảng Nam", "Khánh Hòa", "Phan Rang", "Bình Định", "Nghệ An", "Hà Tĩnh", # Miền Trung
        "Tiền Giang", "Đồng Tháp", "Cà Mau", "Sóc Trăng", "An Giang", # Miền Tây
        "Sài Gòn", "Bà Rịa - Vũng Tàu", # Miền Nam
        "Đắk Lắk", "Kon Tum", "Lâm Đồng", "Pleiku", "Đắk Nông", "Gia Lai", # Tây Nguyên
        "Anh", "Pháp", "Mỹ", "Ý", "Đức", "Hy Lạp", "Nhật Bản", "Hàn Quốc", "Trung Quốc" # Nước ngoài
    ],

    # 5. Place (Không gian/Vật chất): Decor, Vibe, Sound
    [
        "đèn vàng", "cửa sổ", "ghế êm", "chậu hoa", "bàn hai người", "nến", "tiểu cảnh", "rèm", # Vật chất
        "thoáng đãng", "ấm áp", "riêng tư", "hương tinh dầu", "lãng mạn", "kết nối", # Không gian
        "nhạc", "yên tĩnh", "âm thanh nền" # Âm thanh
    ],

    # 6. Giá tiền (Price)
    [
        "siêu rẻ", "rẻ", "bình dân", "sang", "nhà hàng", "cao cấp", "thượng lưu", "đại gia"
    ],

    # 7. Thời điểm/dịp (Occasion)
    [
        "bữa sáng", "ăn vặt", "tráng miệng", "buổi đêm", "buổi trưa"
    ]
]