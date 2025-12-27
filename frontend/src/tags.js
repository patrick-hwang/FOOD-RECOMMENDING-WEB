// src/utils/tags.js

export const HIERARCHICAL_TAGS = {
    // 1. PRICE
    price_range: [
        { 
            name: "Phân khúc", 
            children: ["siêu rẻ", "rẻ", "bình dân", "sang", "nhà hàng", "cao cấp"] 
        }
    ],

    // 2. ORIGIN
    cuisine_origin: [
        { 
            name: "Việt Nam", 
            children: [
                "Hà Nội", "Hải Phòng",
                "Phú Yên", "Huế", "Quảng Ngãi", "Đà Nẵng", "Quảng Nam", "Khánh Hòa", "Phan Rang", "Bình Định", "Nghệ An", "Hà Tĩnh",
                "Tiền Giang", "Đồng Tháp", "Cà Mau", "Sóc Trăng", "An Giang", 
                "Sài Gòn", "Bà Rịa - Vũng Tàu",
                "Lâm Đồng"
            ] 
        },
        { 
            name: "Quốc tế", 
            children: ["Pháp", "Mỹ", "Ý", "Đức", "Nhật Bản", "Hàn Quốc", "Trung Quốc"] 
        }
    ],

    // 3. DISH (Món ăn)
    main_dishes: [
        { 
            name: "Món Sợi", 
            children: ["bún", "phở", "hủ tiếu", "mì sợi", "bánh canh bột gạo", "bánh đa", "miến dong", "miến/bún tàu"] 
        },
        {
            name: "Món Nếp",
            children: ["cơm", "xôi", "cốm", "bánh nếp", "chè nếp", "nếp hấp"]
        },
        {
            name: "Bánh Bột Gạo",
            children: ["bánh xèo", "bánh bèo", "bánh căn", "bánh cuốn", "bánh ướt", "bánh hỏi", "bánh bò", "bánh đúc"]
        },
        {
            name: "Bánh Bột Mì",
            children: ["bánh mì", "bánh bao", "bánh quẩy", "bánh tiêu", "bánh su kem", "bánh bông lan", "donut"]
        },
        {
            name: "Món Nước",
            children: ["súp", "lẩu", "cháo", "cà ri", "hầm"]
        },
        { 
            name: "Món Khô", 
            children: ["xào", "chiên", "nướng", "trộn", "hấp", "kho", "rang", "quay", "luộc"] 
        },
        {
            name: "Thức Uống",
            children: ["cà phê", "trà sữa", "nước ép/ sinh tố", "có cồn", "nước có ga"]
        },
        {
            name: "Đồ Ăn Ngọt",
            children: ["chè", "kem tươi", "kem cheese", "sữa chua", "trân châu", "thạch", "kem trứng", "flan"]
        },
    ],

    // 4. INGREDIENT (Nguyên liệu - NEW 6th Filter)
    ingredients: [
        {
            name: "Thảo Mộc",
            children: ["sả", "hồi", "quế", "gừng", "lá dứa", "vani"]
        },
        {
            name: "Thịt Gia Súc",
            children: ["thịt bò", "thịt heo", "thịt trâu", "thịt dê", "thịt cừu"]
        },
        {
            name: "Thịt Gia Cầm",
            children: ["thịt gà", "thịt vịt", "thịt ngan", "thịt ngỗng", "thịt chim cút"]
        },
        {
            name: "Hải sản",
            children: ["tôm", "mực", "cá", "nghêu", "sò", "ốc", "cua"]
        },
        {
            name: "Món Chay",
            children: ["rau củ", "đậu hũ", "nấm", "chả chay", "mì chay", "cơm chay"]
        },
        {
            name: "Sữa, Trứng",
            children: ["sữa", "trứng gà", "trứng cút"]
        },
        {
            name: "Đậu - Hạt",
            children: ["đậu phộng", "đậu đen", "đậu đỏ", "đậu ván", "ca cao", "hạt sen"]
        },
        {
            name: "Nguyên Liệu Khác",
            children: ["bắp", "rau má", "matcha", "cacao", "nước cốt dừa", "dừa"]
        }
    ],

    // 5. OCCASION (Dịp & Không gian)
    occasion: [
        { 
            name: "Thời điểm", 
            children: ["bữa sáng", "buổi trưa", "buổi đêm", "ăn vặt", "tráng miệng"] },
    ],

    // 6. DISTANCE (Hardcoded logic in component, but structure kept for consistency)
    distance: [
        { name: "Gần tôi", children: ["Dưới 1km", "1km - 3km"] },
        { name: "Xung quanh", children: ["3km - 5km", "5km - 10km"] }
    ]
};