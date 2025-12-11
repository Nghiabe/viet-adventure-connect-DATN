// src/data/mockItinerary.ts
// THIS IS THE UPGRADED, GOLD-STANDARD MOCK DATA

export const mockDaNangItinerary = {
  _id: "mock-itinerary-danang-001",
  startDate: "2024-09-21",
  endDate: "2024-09-23",
  aiPlan: {
    title: "Kế hoạch du lịch Đà Nẵng",
    summary: {
      // Dates are updated as requested
      duration: "3 ngày 2 đêm (21/09/2024 - 23/09/2024)",
      participants: "2 người",
      budget: "Tiết kiệm & Hợp lý",
      style: "Văn hóa & Ẩm thực, tập trung vào Biển, Thành phố và Chùa chiền."
    },
    schedule: [
      {
        day: 1,
        title: "Chào Đà Nẵng - Chinh phục Sơn Trà & Biển đêm",
        activities: [
          { 
            time: "14:00", 
            type: "Nhận phòng", 
            title: "Ổn định tại khách sạn/homestay", 
            description: "Nhận phòng và nghỉ ngơi. Gợi ý chọn khu vực gần biển Mỹ Khê (An Thượng, Hà Bổng) để tiện di chuyển và tận hưởng không khí biển.", 
            rating: 4.5, 
            cost: 0, 
            tips: null 
          },
          { 
            time: "15:30", 
            type: "Tham quan", 
            title: "Bán đảo Sơn Trà & Chùa Linh Ứng", 
            description: "Thuê xe máy và bắt đầu hành trình khám phá 'lá phổi xanh' của Đà Nẵng. Dừng chân tại Chùa Linh Ứng để viếng tượng Phật Bà Quan Âm cao nhất Việt Nam và ngắm toàn cảnh vịnh Đà Nẵng.", 
            location: "Bán đảo Sơn Trà, Đà Nẵng", 
            duration: "3 giờ", 
            rating: 4.8, 
            cost: 0, 
            tips: "Đường lên Sơn Trà có nhiều dốc cua, hãy đi xe số và kiểm tra phanh cẩn thận. Đừng quên ghé thăm Cây Đa Ngàn Năm." 
          },
          { 
            time: "18:30", 
            type: "Ăn uống", 
            title: "Bữa tối Hải sản tươi sống", 
            description: "Thưởng thức hải sản tươi ngon tại các quán ăn địa phương dọc bờ biển. Quán Bé Mặn là một lựa chọn nổi tiếng và giá cả hợp lý.", 
            location: "Khu vực biển Mỹ Khê, đường Võ Nguyên Giáp", 
            duration: "1.5 giờ", 
            rating: 4.6, 
            cost: 400000, 
            tips: null 
          },
          { 
            time: "20:00", 
            type: "Trải nghiệm", 
            title: "Dạo Cầu Rồng và Cầu Tình Yêu", 
            description: "Đi dạo và chụp ảnh tại Cầu Tình Yêu lãng mạn. Nếu là cuối tuần (Thứ 7, CN), hãy chờ đến 21:00 để xem Cầu Rồng phun lửa và nước.", 
            location: "Bờ sông Hàn, Đà Nẵng", 
            duration: "1.5 giờ", 
            rating: 4.7, 
            cost: 0, 
            tips: null 
          }
        ]
      },
      {
        day: 2,
        title: "Ngũ Hành Sơn huyền bí & Hội An cổ kính",
        activities: [
          { 
            time: "08:30", 
            type: "Tham quan", 
            title: "Khám phá Ngũ Hành Sơn", 
            description: "Chinh phục ngọn Thủy Sơn, khám phá các hang động huyền bí như động Huyền Không, động Âm Phủ và các ngôi chùa cổ. Có thể đi thang máy nếu không muốn leo bộ.", 
            location: "Ngũ Hành Sơn, Đà Nẵng", 
            duration: "3 giờ", 
            rating: 4.7, 
            cost: 60000, 
            tips: "Nên mang giày thể thao vì phải đi bộ và leo trèo khá nhiều. Mua các sản phẩm đá mỹ nghệ ở làng Non Nước dưới chân núi." 
          },
          { 
            time: "12:00", 
            type: "Ăn uống", 
            title: "Đặc sản Bánh tráng cuốn thịt heo", 
            description: "Thưởng thức món Bánh tráng cuốn thịt heo nổi tiếng tại quán Trần hoặc Mậu. Đây là một trải nghiệm ẩm thực không thể bỏ lỡ.", 
            location: "Quán Trần, đường Lê Duẩn", 
            duration: "1 giờ", 
            rating: 4.8, 
            cost: 150000, 
            tips: null 
          },
          { 
            time: "15:00", 
            type: "Di chuyển & Tham quan", 
            title: "Khám phá Phố cổ Hội An", 
            description: "Di chuyển đến Hội An (khoảng 45 phút). Dành cả buổi chiều và tối để đi dạo trong không gian cổ kính, mua sắm, và thưởng thức ẩm thực đường phố.", 
            location: "Phố cổ Hội An, Quảng Nam", 
            duration: "5-6 giờ", 
            rating: 5.0, 
            cost: 120000, 
            tips: "Hãy thử đi thuyền trên sông Hoài vào buổi tối và thả đèn hoa đăng để cầu may mắn." 
          }
        ]
      },
      {
        day: 3,
        title: "Chào buổi sáng và Tạm biệt",
        activities: [
          { 
            time: "08:00", 
            type: "Ăn uống", 
            title: "Bữa sáng & Cà phê địa phương", 
            description: "Thưởng thức một tô Bún chả cá nóng hổi, một đặc sản buổi sáng của người Đà Nẵng, và nhâm nhi ly cà phê tại một quán cóc ven đường.", 
            location: "Bún chả cá Bà Lữ, 319 Hùng Vương", 
            duration: "1 giờ", 
            rating: 4.6, 
            cost: 50000, 
            tips: null 
          },
          { 
            time: "09:30", 
            type: "Mua sắm", 
            title: "Mua sắm đặc sản tại Chợ Hàn", 
            description: "Tham quan và mua sắm các loại đặc sản địa phương như chả bò, mắm, hải sản khô để làm quà cho người thân.", 
            location: "119 Trần Phú, Đà Nẵng", 
            duration: "1.5 giờ", 
            rating: 4.5, 
            cost: 0, 
            tips: null 
          },
          { 
            time: "12:00", 
            type: "Trả phòng", 
            title: "Kết thúc hành trình", 
            description: "Quay về khách sạn, thu dọn hành lý và làm thủ tục trả phòng.", 
            rating: 0, 
            cost: 0, 
            tips: null 
          }
        ]
      }
    ],
    suggestions: {
      // More specific hotel recommendations
      hotels: [
        { 
          name: "Adaline Hotel & Suite", 
          category: "Khách sạn 3 sao", 
          reason: "Gần biển, có hồ bơi, giá hợp lý." 
        },
        { 
          name: "The Memory - Danang", 
          category: "Homestay", 
          reason: "Thiết kế đẹp, độc đáo, phù hợp cho người thích chụp ảnh." 
        },
        { 
          name: "Posiki Dorm & Cafe", 
          category: "Hostel", 
          reason: "Siêu tiết kiệm, phù hợp cho du lịch bụi." 
        }
      ],
      transport: "Thuê xe máy là lựa chọn linh hoạt và tiết kiệm nhất để khám phá Đà Nẵng - Hội An (Giá khoảng 120,000 - 150,000 VND/ngày).",
      // Added general notes
      general_notes: [
        "Luôn hỏi giá trước khi mua hàng hoặc sử dụng dịch vụ để tránh bị nói thách.",
        "Đà Nẵng là một thành phố rất an toàn, bạn có thể thoải mái đi dạo vào buổi tối.",
        "Hãy thử các ứng dụng đặt xe công nghệ như Grab/Gojek để di chuyển trong thành phố với giá cả minh bạch."
      ]
    }
  }
};

// Additional mock itineraries for different destinations
export const mockHanoiItinerary = {
  _id: "mock-itinerary-hanoi-001",
  startDate: "2024-10-15",
  endDate: "2024-10-16",
  aiPlan: {
    title: "Khám phá Hà Nội cổ kính",
    summary: {
      duration: "2 ngày 1 đêm (15/10/2024 - 16/10/2024)",
      participants: "2 người",
      budget: "Trung bình",
      style: "Văn hóa & Lịch sử, tập trung vào Phố cổ và Ẩm thực truyền thống."
    },
    schedule: [
      {
        day: 1,
        title: "Phố cổ Hà Nội & Văn Miếu",
        activities: [
          { 
            time: "08:00", 
            type: "Tham quan", 
            title: "Khám phá Phố cổ Hà Nội", 
            description: "Dạo bộ qua các con phố cổ kính, thưởng thức cà phê vỉa hè và mua sắm đồ lưu niệm.", 
            rating: 4.8, 
            cost: 0, 
            tips: null 
          },
          { 
            time: "12:00", 
            type: "Ăn uống", 
            title: "Bún chả Hương Liên", 
            description: "Thưởng thức món bún chả nổi tiếng mà cựu Tổng thống Obama đã từng ăn.", 
            rating: 4.9, 
            cost: 100000, 
            tips: null 
          },
          { 
            time: "14:00", 
            type: "Tham quan", 
            title: "Văn Miếu - Quốc Tử Giám", 
            description: "Tham quan ngôi đền đầu tiên của Việt Nam, tìm hiểu về lịch sử giáo dục.", 
            rating: 4.7, 
            cost: 30000, 
            tips: null 
          },
          { 
            time: "18:00", 
            type: "Ăn uống", 
            title: "Ăn tối tại nhà hàng Madame Hiền", 
            description: "Ẩm thực Việt Nam tinh tế trong không gian cổ điển.", 
            rating: 4.6, 
            cost: 500000, 
            tips: null 
          }
        ]
      },
      {
        day: 2,
        title: "Hồ Gươm & Lăng Bác",
        activities: [
          { 
            time: "07:00", 
            type: "Tham quan", 
            title: "Dạo bộ quanh Hồ Gươm", 
            description: "Thưởng thức không khí trong lành và ngắm nhìn Tháp Rùa cổ kính.", 
            rating: 4.9, 
            cost: 0, 
            tips: null 
          },
          { 
            time: "09:00", 
            type: "Tham quan", 
            title: "Tham quan Lăng Chủ tịch Hồ Chí Minh", 
            description: "Viếng thăm nơi an nghỉ của vị lãnh tụ vĩ đại của dân tộc.", 
            rating: 4.8, 
            cost: 0, 
            tips: null 
          },
          { 
            time: "11:00", 
            type: "Tham quan", 
            title: "Bảo tàng Hồ Chí Minh", 
            description: "Tìm hiểu về cuộc đời và sự nghiệp của Bác Hồ.", 
            rating: 4.5, 
            cost: 40000, 
            tips: null 
          },
          { 
            time: "13:00", 
            type: "Ăn uống", 
            title: "Phở Bát Đàn", 
            description: "Thưởng thức tô phở Hà Nội chính gốc trước khi kết thúc chuyến đi.", 
            rating: 4.9, 
            cost: 80000, 
            tips: null 
          }
        ]
      }
    ],
    suggestions: {
      hotels: [
        { 
          name: "Sofitel Legend Metropole Hanoi", 
          category: "Khách sạn 5 sao", 
          reason: "Khách sạn lịch sử nổi tiếng, gần Hồ Gươm." 
        },
        { 
          name: "Hanoi La Siesta Hotel & Spa", 
          category: "Khách sạn 4 sao", 
          reason: "Thiết kế đẹp, gần phố cổ, có spa." 
        }
      ],
      transport: "Đi bộ và taxi là lựa chọn tốt nhất để khám phá Hà Nội.",
      general_notes: [
        "Hà Nội có 4 mùa rõ rệt, nên kiểm tra thời tiết trước khi đi.",
        "Phố cổ Hà Nội rất đông người, nên cẩn thận đồ đạc."
      ]
    }
  }
};

// Function to get mock itinerary based on destination
export const getMockItinerary = (destination: string) => {
  const lowerDestination = destination.toLowerCase();
  
  if (lowerDestination.includes('đà nẵng') || lowerDestination.includes('danang')) {
    return mockDaNangItinerary;
  } else if (lowerDestination.includes('hà nội') || lowerDestination.includes('hanoi')) {
    return mockHanoiItinerary;
  } else {
    // Default to Da Nang for any other destination
    return mockDaNangItinerary;
  }
};

// We can infer the type directly from the mock object for perfect type safety
export type Itinerary = typeof mockDaNangItinerary;