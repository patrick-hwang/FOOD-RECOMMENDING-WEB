import React, { useState, useEffect, useRef } from 'react';

// --- (Các component con TagRow, UserIcon giữ nguyên) ---
const TagRow = ({ label, data }) => {
  if (!data) return null;
  let content;
  if (Array.isArray(data)) {
    content = (
      <div className="flex flex-wrap pt-2">
        {data.map((item, index) => (
          <span key={index} className="mr-2 mb-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {item}
          </span>
        ))}
      </div>
    );
  } else {
    content = <span className="text-gray-900 font-medium capitalize">{data}</span>;
  }
  return (
    <div className="py-4 border-b last:border-b-0">
      <div className="grid grid-cols-3 gap-4">
        <span className="text-gray-500 font-semibold col-span-1">{label}</span>
        <div className="col-span-2">{content}</div>
      </div>
    </div>
  );
};

const UserIcon = () => (
  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
  </svg>
);
// --- (Hết component con) ---


// --- Component chính ---
function RestaurantDetail() {
  
  // --- STATE (Trạng thái) ---
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [allIds, setAllIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); 
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // --- EFFECT 1: Lấy danh sách TẤT CẢ ID (Chạy 1 lần) ---
  useEffect(() => {
    const fetchAllIds = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/restaurants/all_ids");
        if (!response.ok) {
          throw new Error("Không thể lấy danh sách IDs");
        }
        const idList = await response.json();
        
        if (idList && idList.length > 0) {
          setAllIds(idList); 
          setCurrentIndex(0); 
        } else {
          setError("Không tìm thấy nhà hàng nào trong database.");
        }
      } catch (e) {
        console.error("Lỗi khi fetch all IDs:", e);
        setError("Lỗi kết nối đến API để lấy danh sách ID.");
      }
    };

    fetchAllIds();
  }, []); 

  // --- EFFECT 2: Lấy dữ liệu 1 quán ăn (Chạy mỗi khi `currentIndex` thay đổi) ---
  useEffect(() => {
    if (allIds.length === 0) {
        if (restaurant === null) setLoading(true);
        return;
    }
    
    const currentId = allIds[currentIndex];

    const fetchRestaurantData = async () => {
      try {
        setLoading(true); 
        setError(null);
        
        const response = await fetch(`http://127.0.0.1:8000/api/restaurant/${currentId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRestaurant(data); // <-- Dữ liệu mới sẽ được set ở đây
        
      } catch (e) {
        console.error("Lỗi khi fetch dữ liệu:", e);
        setError(`Lỗi: Không thể tải dữ liệu.\nHãy chắc chắn backend (app.py) đang chạy.\n${e.message}`);
      } finally {
        setLoading(false); // <-- Dọn dẹp loading
      }
    };

    fetchRestaurantData();
    
    // Xóa bản đồ cũ khi chuyển quán
    if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
    }
    
    // Cuộn lên đầu trang
    window.scrollTo(0, 0);

  }, [currentIndex, allIds]); 

  // --- EFFECT 3: Khởi tạo bản đồ (Chạy khi `restaurant` thay đổi) ---
  useEffect(() => {
    // Chỉ khởi tạo map KHI đã có dữ liệu và map CHƯA được tạo
    if (!loading && restaurant && mapContainerRef.current && !mapInstanceRef.current) {
      const [lng, lat] = restaurant.location.coordinates;
      // Kiểm tra 'L' (Leaflet) có tồn tại không
      if (typeof L === 'undefined') return; 

      const map = L.map(mapContainerRef.current).setView([lat, lng], 16); 
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>${restaurant.name}</b><br>${restaurant.address}`)
        .openPopup();
      mapInstanceRef.current = map;
    }
  }, [loading, restaurant]); // Chạy lại khi loading hoặc restaurant thay đổi

  // --- HÀM XỬ LÝ NÚT BẤM (MỚI) ---
  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % allIds.length;
    setCurrentIndex(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + allIds.length) % allIds.length;
    setCurrentIndex(prevIndex);
  };


  // --- Render (Hiển thị) ---
  if (error && !restaurant) {
    // Lỗi nghiêm trọng lúc ban đầu
    return <div className="p-8 text-center text-red-600 bg-red-100 rounded-lg whitespace-pre-wrap">{error}</div>;
  }

  if (loading && !restaurant) {
     // Loading lần đầu tiên
    return <div className="p-8 text-center text-lg font-semibold">Đang tải danh sách...</div>;
  }
  
  // --- Giao diện chính ---
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="p-4 md:p-8">

        {/* --- KHU VỰC ĐIỀU HƯỚNG --- */}
        <div className="mb-4 p-4 bg-white shadow-lg rounded-lg flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={allIds.length === 0 || loading} // Tắt nút khi đang tải
            className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50"
          >
            &larr; Quán Trước
          </button>
          <div className="text-center">
            {/* Hiển thị "Đang tải..." ở đây thay vì dọn dẹp UI */}
            {loading ? (
              <span className="font-semibold text-lg text-blue-600">Đang tải quán mới...</span>
            ) : (
              <span className="font-semibold text-lg">Đang xem Quán</span>
            )}
            <br />
            <span className="text-sm text-gray-600">({currentIndex + 1} / {allIds.length})</span>
          </div>
          <button
            onClick={handleNext}
            disabled={allIds.length === 0 || loading} // Tắt nút khi đang tải
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Quán Kế Tiếp &rarr;
          </button>
        </div>
        
        {/* Báo lỗi nếu có, nhưng vẫn giữ UI cũ */}
        {error && 
          <div className="p-4 mb-4 text-center text-red-600 bg-red-100 rounded-lg whitespace-pre-wrap">{error}</div>
        }
        
        {/*
          --- SỬA LỖI QUAN TRỌNG ---
          Xóa bỏ `!loading` khỏi điều kiện này.
          Chúng ta muốn render `restaurant` (dù là cũ hay mới)
          miễn là nó tồn tại, bất kể trạng thái `loading`.
        */}
        {restaurant && (
          // Thêm hiệu ứng "mờ" đi khi đang tải
          <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            
            {/* --- KHU VỰC HEADER (Tên, Rating, Địa chỉ) --- */}
            <div className="mb-8 p-6 bg-white shadow-lg rounded-lg">
              <h1 className="text-5xl font-bold text-gray-900 mb-3">{restaurant.name}</h1>
              <p className="text-xl text-gray-600 mb-4">{restaurant.address}</p>
              <div className="flex items-center">
                <span className="text-xl text-yellow-500 font-bold">★ {restaurant.rating}</span>
                <span className="ml-2 text-lg text-gray-500">({restaurant.Nreview} đánh giá)</span>
              </div>
            </div>

            {/* --- KHU VỰC NỘI DUNG (Layout 2 cột) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* CỘT TRÁI (Nội dung chính) */}
              <div className="lg:col-span-2 space-y-8">
                 {/* --- KHU VỰC HÌNH ẢNH --- */}
                {restaurant.image_urls && restaurant.image_urls.length > 0 && (
                  <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <h2 className="text-2xl font-semibold p-6 border-b">Hình ảnh</h2>
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {restaurant.image_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`${restaurant.name} image ${index + 1}`}
                          className="w-full h-32 md:h-40 object-cover rounded-lg shadow-md cursor-pointer transition-transform duration-200 hover:scale-105"
                          onError={(e) => { e.target.src = 'https://placehold.co/400x300/eee/ccc?text=Image+Error'; }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* --- KHU VỰC TAGS --- */}
                {restaurant.tags && (
                  <div className="bg-white shadow-lg rounded-lg">
                    <h2 className="text-2xl font-semibold p-6 border-b">Chi tiết</h2>
                    <div className="divide-y px-6">
                      <TagRow label="Loại hình" data={restaurant.type} />
                      <TagRow label="Món chính" data={restaurant.tags.main_dishes} />
                      <TagRow label="Giá cả" data={restaurant.tags.price_range} />
                      <TagRow label="Nguồn gốc" data={restaurant.tags.cuisine_origin} />
                      <TagRow label="Đặc sản" data={restaurant.tags.is_vietnamese_specialty ? "Có" : "Không"} />
                    </div>
                  </div>
                )}

                {/* --- KHU VỰC REVIEWS --- */}
                {restaurant.review && restaurant.review.length > 0 && (
                  <div className="bg-white shadow-lg rounded-lg">
                    <h2 className="text-2xl font-semibold p-6 border-b">Đánh giá nổi bật</h2>
                    <div className="p-6 space-y-6">
                      {restaurant.review.map((rev, index) => (
                        <div key={index} className="flex space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-700 italic whitespace-pre-wrap">
                              "{rev}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* CỘT PHẢI (Sidebar) */}
              <div className="lg:col-span-1 space-y-8">
                <div className="sticky top-8">
                  <div className="bg-white shadow-lg rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">Vị trí</h3>
                    <div 
                      ref={mapContainerRef} 
                      className="h-64 md:h-80 w-full rounded-lg shadow-md"
                    >
                      {/* Bản đồ sẽ được chèn vào đây */}
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      {restaurant.address}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RestaurantDetail;