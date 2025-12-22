// src/utils/tags.js

export const HIERARCHICAL_TAGS = {
    price_range: [
        { 
            name: "Bình dân", 
            children: ["siêu rẻ", "rẻ", "bình dân"] 
        },
        { 
            name: "Sang trọng", 
            children: ["sang", "nhà hàng", "cao cấp"] 
        }
    ],
    cuisine_origin: [
        { 
            name: "Việt Nam", 
            children: [
                "Hà Nội", "Hải Phòng", "Phú Yên", "Huế", "Quảng Ngãi", 
                "Đà Nẵng", "Quảng Nam", "Khánh Hòa", "Phan Rang", "Bình Định", 
                "Nghệ An", "Hà Tĩnh", "Tiền Giang", "Đồng Tháp", "Cà Mau", 
                "Sóc Trăng", "An Giang", "Sài Gòn", "Bà Rịa - Vũng Tàu", "Lâm Đồng"
            ] 
        },
        { 
            name: "Quốc tế", 
            children: [
                "Pháp", "Mỹ", "Ý", "Đức", "Nhật Bản", "Hàn Quốc", "Trung Quốc"
            ] 
        }
    ],
    main_dishes: [
        { 
            name: "Món Sợi & Nước", 
            children: [
                "bún", "phở", "hủ tiếu", "mì sợi", "bánh canh bột gạo", "bánh đa", 
                "miến dong", "miến/bún tàu", "súp", "lẩu", "cháo", "cà ri", "hầm"
            ] 
        },
        { 
            name: "Cơm & Nếp", 
            children: [
                "cơm", "bắp", "xôi", "bánh nếp", "cốm", "chè nếp", "nếp hấp"
            ] 
        },
        { 
            name: "Các loại Bánh", 
            children: [
                "bánh xèo", "bánh bèo", "bánh căn", "bánh cuốn", "bánh ướt", 
                "bánh hỏi", "bánh bò", "bánh đúc", "bánh mì", "bánh bao", 
                "bánh quẩy", "bánh tiêu", "bánh su kem", "bánh bông lan", "donut"
            ] 
        },
        { 
            name: "Món Mặn (Thịt/Cá)", 
            children: [
                "thịt bò", "thịt heo", "thịt trâu", "thịt dê", "thịt cừu", 
                "thịt gà", "thịt vịt", "thịt ngan", "thịt ngỗng", "thịt chim cút",
                "tôm", "mực", "cá", "nghêu", "sò", "ốc", "cua"
            ] 
        },
        { 
            name: "Chay & Rau", 
            children: [
                "rau củ", "đậu hũ", "nấm", "chả chay", "mì chay", "cơm chay"
            ] 
        },
        {
            name: "Đồ uống & Tráng miệng",
            children: [
                "cà phê", "trà sữa", "nước ép/ sinh tố", "có cồn", "nước có ga",
                "chè", "kem tươi", "kem cheese", "sữa chua", "trân châu", 
                "thạch", "kem trứng", "flan", "rau má", "matcha", "cacao", "dừa"
            ]
        }
    ],
    occasion: [
        { 
            name: "Bữa chính", 
            children: ["bữa sáng", "buổi trưa", "buổi tối"] // Added 'buổi tối' generally implied 
        },
        { 
            name: "Ăn chơi & Đêm", 
            children: ["ăn vặt", "tráng miệng", "buổi đêm"] 
        }
    ],
    distance: [
        { name: "Gần tôi", children: ["Dưới 1km", "1km - 3km"] },
        { name: "Xung quanh", children: ["3km - 5km", "5km - 10km"] }
    ]
};