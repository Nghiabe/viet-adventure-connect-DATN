/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dbConnect from '../src/lib/dbConnect';
import Destination from '../src/models/Destination';
dotenv.config({ path: '.env.local' });

const destinationsToSeed = [
  // Du lịch
    {
      "name": "Hà Nội",
      "slug": "ha-noi",
      "description": "Thủ đô ngàn năm văn hiến của Việt Nam, là sự giao thoa quyến rũ giữa kiến trúc Pháp cổ kính, những ngôi đền chùa linh thiêng và nhịp sống hiện đại. Nổi tiếng với Khu Phố Cổ và nền ẩm thực đường phố phong phú.",
      "history": "Được thành lập với tên Thăng Long vào năm 1010, Hà Nội đã là trung tâm chính trị của Việt Nam trong nhiều thế kỷ. Lịch sử hào hùng của nó được ghi dấu tại các di tích như Hoàng thành Thăng Long và Văn Miếu - Quốc Tử Giám.",
      "culture": "Văn hóa Hà Nội đặc trưng bởi nghệ thuật múa rối nước độc đáo, 36 phố phường nhộn nhịp, và văn hóa cà phê vỉa hè, đặc biệt là món cà phê trứng trứ danh.",
      "geography": "Nằm ở trung tâm Đồng bằng sông Hồng, Hà Nội được bao quanh bởi các con sông, với Hồ Hoàn Kiếm và Hồ Tây là lá phổi xanh của thành phố.",
      "mainImage": "/uploads/images/ha-noi-1.jpg",
      "imageGallery": [
        "/uploads/images/ha-noi-2.jpg",
        "/uploads/images/ha-noi-3.jpg",
        "/uploads/images/ha-noi-4.jpg"
      ],
      "bestTimeToVisit": "Mùa thu (tháng 9 - tháng 11) với tiết trời mát mẻ, khô ráo và lãng mạn.",
      "essentialTips": ["Hãy thử món cà phê trứng độc đáo tại một quán cà phê trong khu phố cổ.", "Dành thời gian đi bộ lang thang qua 36 phố phường để khám phá và mua sắm.", "Xem một buổi biểu diễn múa rối nước truyền thống để hiểu thêm về văn hóa dân gian."]
    },
    {
      "name": "Vịnh Hạ Long",
      "slug": "ha-long-bay",
      "description": "Di sản Thiên nhiên Thế giới được UNESCO công nhận, Vịnh Hạ Long nổi bật với hàng nghìn hòn đảo đá vôi hùng vĩ muôn hình vạn trạng nổi lên từ mặt nước biển xanh màu ngọc bích. Đây là một trong những điểm du lịch nổi tiếng nhất Việt Nam.",
      "history": "Vịnh Hạ Long có một lịch sử địa chất phức tạp kéo dài hơn 500 triệu năm, với các quá trình kiến tạo đa dạng đã tạo nên cảnh quan độc đáo ngày nay.",
      "culture": "Văn hóa địa phương gắn liền với cuộc sống trên biển của các làng chài. Các hoạt động như chèo thuyền kayak và thăm hang động là một phần không thể thiếu trong trải nghiệm văn hóa tại đây.",
      "mainImage": "/uploads/images/ha-long-1.jpg",
      "imageGallery": [
        "/uploads/images/ha-long-2.jpg",
        "/uploads/images/ha-long-3.jpg",
        "/uploads/images/ha-long-4.jpg"
      ],
      "bestTimeToVisit": "Tháng 3 - Tháng 5 và Tháng 9 - Tháng 11, khi thời tiết khô ráo và dễ chịu.",
      "essentialTips": ["Nên đặt du thuyền qua đêm để trải nghiệm trọn vẹn vẻ đẹp của vịnh vào bình minh và hoàng hôn.", "Mang theo kem chống nắng và mũ vì nắng trên biển khá gắt.", "Hãy thử các món hải sản tươi sống được đánh bắt ngay tại vịnh."]
    },
    {
      "name": "Sa Pa",
      "slug": "sapa",
      "description": "Nằm ở phía Tây Bắc Việt Nam, Sa Pa là một thị trấn trong sương nổi tiếng với những thửa ruộng bậc thang kỳ vĩ, những dãy núi hùng vĩ bao quanh, và là nơi sinh sống của nhiều cộng đồng dân tộc thiểu số đầy màu sắc.",
      "history": "Sa Pa ban đầu được người Pháp thành lập như một trạm nghỉ dưỡng trên núi vào đầu thế kỷ 20. Dấu ấn kiến trúc Pháp vẫn còn lại ở nhà thờ đá và các biệt thự cũ.",
      "culture": "Văn hóa Sa Pa là sự hòa quyện đa dạng của các dân tộc như H'Mông, Dao Đỏ, Tày. Du khách có thể trải nghiệm văn hóa bản địa qua các phiên chợ cuối tuần và các làng nghề thủ công.",
      "geography": "Sa Pa tọa lạc trên một cao nguyên ở độ cao khoảng 1.500 mét, thuộc dãy núi Hoàng Liên Sơn, nơi có đỉnh Fansipan - 'Nóc nhà Đông Dương'.",
      "mainImage": "/uploads/images/sapa-1.jpg",
      "imageGallery": [
        "/uploads/images/sapa-2.jpg",
        "/uploads/images/sapa-3.jpg",
        "/uploads/images/sapa-4.jpg"
      ],
      "bestTimeToVisit": "Tháng 3 - Tháng 5 (mùa hoa) và Tháng 9 - Tháng 10 (mùa lúa chín).",
      "essentialTips": ["Thực hiện một chuyến trekking đến các bản làng như Cát Cát, Tả Van.", "Hãy chuẩn bị quần áo đủ ấm vì thời tiết trên núi có thể thay đổi rất nhanh.", "Đừng quên mặc cả khi mua sắm các sản phẩm thổ cẩm tại chợ."]
    },
    {
      "name": "Ninh Bình",
      "slug": "ninh-binh",
      "description": "Được mệnh danh là 'Vịnh Hạ Long trên cạn', Ninh Bình quyến rũ du khách bởi cảnh quan non nước hữu tình với những dòng sông uốn lượn qua các dãy núi đá vôi và những cánh đồng lúa bạt ngàn.",
      "history": "Ninh Bình từng là kinh đô của Việt Nam vào thế kỷ thứ 10 dưới thời nhà Đinh và Tiền Lê, với cố đô Hoa Lư là một di tích lịch sử quan trọng.",
      "culture": "Văn hóa nơi đây gắn liền với nền văn minh lúa nước, thể hiện qua cuộc sống yên bình của người dân địa phương và các lễ hội truyền thống tại chùa Bái Đính, ngôi chùa lớn nhất Việt Nam.",
      "geography": "Ninh Bình là nơi giao thoa giữa Đồng bằng sông Hồng và dãy núi đá vôi Tây Bắc, tạo nên một hệ sinh thái đa dạng và cảnh quan độc đáo.",
      "mainImage": "Thuyền nan chở du khách trên sông Ngô Đồng ở Tam Cốc, Ninh Bình",
      "imageGallery": ["Toàn cảnh khu du lịch Tràng An nhìn từ trên cao", "Cổng vào khu di tích Cố đô Hoa Lư", "Hang Múa với tầm nhìn bao quát ra những cánh đồng lúa"],
      "bestTimeToVisit": "Tháng 5 - Tháng 6 (mùa lúa chín) và Tháng 1 - Tháng 3 (mùa lễ hội).",
      "essentialTips": ["Hãy đi thuyền ở Tràng An hoặc Tam Cốc để chiêm ngưỡng trọn vẹn vẻ đẹp.", "Leo lên đỉnh Hang Múa để có được những bức ảnh toàn cảnh đẹp nhất.", "Thưởng thức các đặc sản địa phương như thịt dê núi và cơm cháy."]
    },
    {
      "name": "Hà Giang",
      "slug": "ha-giang",
      "description": "Hà Giang, vùng đất địa đầu Tổ quốc, là một điểm đến dành cho những người yêu thích phiêu lưu với những cung đường đèo ngoạn mục, những thung lũng sâu thẳm và những bản làng của người dân tộc thiểu số cheo leo trên sườn núi.",
      "history": "Đây là vùng đất có lịch sử lâu đời, là nơi sinh sống của hơn 20 dân tộc anh em. Cột cờ Lũng Cú là một biểu tượng thiêng liêng khẳng định chủ quyền quốc gia.",
      "culture": "Văn hóa Hà Giang vô cùng phong phú, từ những phiên chợ lùi độc đáo, lễ hội hoa tam giác mạch, cho đến những ngôi nhà trình tường đặc trưng của người H'Mông.",
      "geography": "Hà Giang là một cao nguyên đá vôi, với Công viên địa chất toàn cầu Cao nguyên đá Đồng Văn được UNESCO công nhận. Đèo Mã Pí Lèng là một trong 'tứ đại đỉnh đèo' của Việt Nam.",
      "mainImage": "Cung đường đèo Mã Pí Lèng uốn lượn bên dòng sông Nho Quế màu xanh ngọc",
      "imageGallery": ["Những cánh đồng hoa tam giác mạch nở rộ vào mùa thu", "Cột cờ Lũng Cú, điểm cực Bắc của Việt Nam", "Những đứa trẻ người H'Mông chơi đùa trên cao nguyên đá"],
      "bestTimeToVisit": "Tháng 10 - Tháng 11 (mùa hoa tam giác mạch) và mùa xuân (mùa hoa mận, hoa đào).",
      "essentialTips": ["Thuê xe máy để trải nghiệm 'Hà Giang Loop' là cách tốt nhất để khám phá.", "Hãy lái xe cẩn thận trên các cung đường đèo và chuẩn bị giấy tờ đầy đủ.", "Xin phép trước khi chụp ảnh người dân địa phương."]
    },
    {
      "name": "Mai Châu",
      "slug": "mai-chau",
      "description": "Nằm ẩn mình trong một thung lũng xanh mướt, Mai Châu là điểm đến lý tưởng để thoát khỏi sự ồn ào của thành phố, tận hưởng không khí trong lành và khám phá cuộc sống bình dị của người dân tộc Thái.",
      "history": "Mai Châu là một thung lũng có lịch sử định cư lâu đời của người Thái trắng.",
      "culture": "Văn hóa Thái đặc trưng bởi những ngôi nhà sàn truyền thống, điệu múa xòe, rượu cần và các món ăn đặc sản như cơm lam, cá nướng.",
      "geography": "Mai Châu là một thung lũng thuộc tỉnh Hòa Bình, được bao bọc bởi các dãy núi và những cánh đồng lúa.",
      "mainImage": "Toàn cảnh thung lũng Mai Châu xanh mướt với những ngôi nhà sàn từ trên cao",
      "imageGallery": ["Du khách đạp xe qua những cánh đồng lúa ở bản Lác", "Một ngôi nhà sàn truyền thống của người Thái", "Phụ nữ Thái dệt thổ cẩm"],
      "bestTimeToVisit": "Tháng 3 - Tháng 5 và Tháng 9 - Tháng 11.",
      "essentialTips": ["Ở tại một nhà sàn (homestay) để có trải nghiệm chân thực nhất.", "Thuê xe đạp để dạo quanh các bản làng.", "Thưởng thức buổi tối với chương trình văn nghệ và uống rượu cần."]
    },
    {
      "name": "Cố đô Huế",
      "slug": "hue-imperial-city",
      "description": "Huế, kinh đô cuối cùng của triều đại nhà Nguyễn, là một thành phố mang vẻ đẹp trầm mặc, cổ kính nằm bên bờ sông Hương thơ mộng. Nơi đây là một trung tâm văn hóa, lịch sử và tâm linh quan trọng của Việt Nam.",
      "history": "Là thủ đô của Việt Nam từ năm 1802 đến 1945, Huế là nơi tọa lạc của Kinh thành Huế, một quần thể kiến trúc đồ sộ bao gồm Hoàng thành và Tử Cấm Thành, cùng với hệ thống lăng tẩm của các vị vua.",
      "culture": "Văn hóa Huế nổi bật với Nhã nhạc Cung đình, tà áo dài tím thướt tha, và một nền ẩm thực cung đình cầu kỳ, tinh tế.",
      "geography": "Thành phố Huế nằm ở miền Trung Việt Nam, được chia cắt bởi dòng sông Hương hiền hòa.",
      "mainImage": "Cổng Ngọ Môn uy nghi của Kinh thành Huế phản chiếu dưới hồ nước",
      "imageGallery": ["Chùa Thiên Mụ, ngôi chùa cổ bảy tầng bên bờ sông Hương", "Lăng Khải Định với kiến trúc kết hợp độc đáo giữa phương Đông và phương Tây", "Một cô gái Huế trong tà áo dài tím truyền thống"],
      "bestTimeToVisit": "Mùa xuân (Tháng 2 - Tháng 4) và mùa thu (Tháng 9 - Tháng 11).",
      "essentialTips": ["Dành ít nhất một ngày để khám phá toàn bộ khu vực Kinh thành.", "Hãy thuê một chiếc thuyền rồng để đi dạo trên sông Hương và nghe ca Huế.", "Thưởng thức các món đặc sản như Bún bò Huế, bánh bèo, bánh nậm, bánh lọc."]
    },
    {
      "name": "Đà Nẵng",
      "slug": "da-nang",
      "description": "Đà Nẵng là một trong những thành phố hiện đại và đáng sống nhất Việt Nam, nổi tiếng với những cây cầu biểu tượng như Cầu Rồng, bãi biển Mỹ Khê quyến rũ, và dãy núi Ngũ Hành Sơn huyền bí.",
      "history": "Trong lịch sử, Đà Nẵng là một thương cảng quốc tế quan trọng được biết đến với tên gọi Tourane và là một trong những thành phố đầu tiên người Pháp đặt chân đến ở Việt Nam.",
      "culture": "Văn hóa Đà Nẵng là sự giao thoa đặc sắc giữa các vùng miền, thể hiện rõ nét qua ẩm thực độc đáo với các món ăn biểu tượng như Mì Quảng và Bánh tráng cuốn thịt heo.",
      "geography": "Tọa lạc ở vùng Nam Trung Bộ, Đà Nẵng có địa thế độc đáo tựa lưng vào dãy Trường Sơn và mặt hướng ra Biển Đông, được bao bọc bởi bán đảo Sơn Trà.",
      "mainImage": "Cầu Vàng trên Bà Nà Hills được nâng đỡ bởi đôi bàn tay khổng lồ vào lúc bình minh",
      "imageGallery": ["Cầu Rồng phun lửa vào ban đêm tại trung tâm thành phố Đà Nẵng", "Bãi biển Mỹ Khê với bãi cát trắng mịn và nước biển trong xanh", "Tượng Phật Bà Quan Âm tại chùa Linh Ứng, bán đảo Sơn Trà"],
      "bestTimeToVisit": "Tháng 2 đến tháng 8, đây là mùa khô với thời tiết nắng đẹp.",
      "essentialTips": ["Đừng bỏ lỡ màn trình diễn Cầu Rồng phun lửa và nước vào 21:00 mỗi tối cuối tuần.", "Hãy thuê xe máy để khám phá cung đường ven biển lên bán đảo Sơn Trà.", "Thưởng thức hải sản tươi sống tại các nhà hàng dọc bờ biển."]
    },
    {
      "name": "Phố cổ Hội An",
      "slug": "hoi-an-ancient-town",
      "description": "Phố cổ Hội An, một Di sản Văn hóa Thế giới, là một ví dụ được bảo tồn đặc biệt tốt về một thương cảng Đông Nam Á. Nơi đây quyến rũ du khách với những con phố đi bộ được thắp sáng bởi hàng trăm chiếc đèn lồng.",
      "history": "Từng là một thương cảng sầm uất, Hội An là điểm giao thoa của các nền văn hóa Nhật Bản, Trung Quốc và châu Âu, thể hiện qua Chùa Cầu và các hội quán.",
      "culture": "Văn hóa Hội An nổi bật với Lễ hội Đèn lồng vào mỗi đêm rằm, nghề may đo thủ công, và một nền ẩm thực độc đáo với các món ăn biểu tượng như Cao Lầu.",
      "geography": "Nằm ở hạ lưu sông Thu Bồn, tỉnh Quảng Nam, Phố cổ Hội An có vị trí địa lý thuận lợi gần biển.",
      "mainImage": "Chùa Cầu biểu tượng của Hội An được thắp sáng lung linh vào ban đêm",
      "imageGallery": ["Những ngôi nhà cổ màu vàng với giàn hoa giấy rực rỡ ở Hội An", "Những chiếc đèn lồng đầy màu sắc được treo khắp các con phố", "Du khách đi thuyền trên sông Hoài vào buổi tối"],
      "bestTimeToVisit": "Tháng 2 đến tháng 4, khi thời tiết khô ráo và nắng nhẹ.",
      "essentialTips": ["Hãy mua vé tham quan để vào bên trong các ngôi nhà cổ và hội quán.", "Thử dịch vụ may đo quần áo lấy nhanh, một trải nghiệm độc đáo.", "Dành một buổi tối để đi dạo phố cổ và thả đèn hoa đăng."]
    },
    {
      "name": "Phong Nha - Kẻ Bàng",
      "slug": "phong-nha-ke-bang",
      "description": "Vườn quốc gia Phong Nha - Kẻ Bàng, một Di sản Thiên nhiên Thế giới, là nơi có hệ thống hang động đá vôi ngoạn mục, bao gồm cả hang Sơn Đoòng - hang động lớn nhất thế giới.",
      "history": "Khu vực này có lịch sử kiến tạo địa chất phức tạp, tạo ra một trong những vùng đá vôi nhiệt đới cổ nhất và lớn nhất châu Á.",
      "culture": "Văn hóa địa phương gắn liền với cuộc sống nông nghiệp và rừng núi.",
      "geography": "Nằm ở tỉnh Quảng Bình, vườn quốc gia này có địa hình núi đá vôi hiểm trở và hệ thống sông ngầm rộng lớn.",
      "mainImage": "Cửa vào một hang động lớn ở Phong Nha với thảm thực vật xanh mướt",
      "imageGallery": ["Du khách chèo thuyền kayak trên sông Son màu xanh ngọc", "Bên trong hang Thiên Đường với những khối thạch nhũ tráng lệ", "Phong cảnh núi non hùng vĩ của Vườn quốc gia Phong Nha - Kẻ Bàng"],
      "bestTimeToVisit": "Mùa khô từ tháng 4 đến tháng 8.",
      "essentialTips": ["Khám phá các hang động chính như Phong Nha, Thiên Đường, và Hang Tối.", "Mang theo đồ bơi để tham gia các hoạt động như tắm bùn trong Hang Tối.", "Nên đặt tour trước, đặc biệt là cho các chuyến thám hiểm mạo hiểm."]
    },
    {
      "name": "Quy Nhơn",
      "slug": "quy-nhon",
      "description": "Quy Nhơn là một thành phố biển yên bình với những bãi biển hoang sơ, những làng chài mộc mạc và những di tích lịch sử của vương quốc Champa xưa.",
      "history": "Đây là vùng đất gắn liền với lịch sử của vương triều Tây Sơn và văn hóa Champa, với các tháp Chăm cổ còn sót lại.",
      "culture": "Văn hóa biển đặc trưng với các làng chài và ẩm thực hải sản phong phú.",
      "geography": "Nằm ở tỉnh Bình Định, Quy Nhơn có đường bờ biển dài và đẹp với các bãi biển nổi tiếng như Kỳ Co, Eo Gió.",
      "mainImage": "Eo Gió, Quy Nhơn với con đường đi bộ ven biển tuyệt đẹp",
      "imageGallery": ["Bãi biển Kỳ Co với nước trong xanh và cát trắng", "Tháp Đôi, một di tích kiến trúc Chăm Pa trong lòng thành phố", "Làng chài Nhơn Lý vào buổi sáng sớm"],
      "bestTimeToVisit": "Mùa khô từ tháng 3 đến tháng 9.",
      "essentialTips": ["Thuê thuyền để ra bãi Kỳ Co và lặn ngắm san hô.", "Khám phá Eo Gió và tịnh xá Ngọc Hòa.", "Thưởng thức các món hải sản tươi ngon và đặc sản bánh hỏi cháo lòng."]
    },
    {
      "name": "Đảo Lý Sơn",
      "slug": "ly-son-island",
      "description": "Đảo Lý Sơn, một huyện đảo của tỉnh Quảng Ngãi, được hình thành từ những vết tích núi lửa và nổi tiếng với những cánh đồng tỏi bạt ngàn, những vách đá hùng vĩ và làn nước biển trong vắt.",
      "history": "Lý Sơn có một lịch sử hào hùng gắn liền với đội hùng binh Hoàng Sa, những người đã đi khai phá và xác lập chủ quyền trên các quần đảo Hoàng Sa, Trường Sa.",
      "culture": "Văn hóa địa phương đặc trưng với nghề trồng tỏi và các lễ hội của ngư dân.",
      "geography": "Huyện đảo bao gồm Đảo Lớn, Đảo Bé và hòn Mù Cu, được hình thành từ dung nham núi lửa.",
      "mainImage": "Cổng Tò Vò ở Lý Sơn vào lúc hoàng hôn",
      "imageGallery": ["Những cánh đồng tỏi xanh mướt trên đảo", "Toàn cảnh đảo Lý Sơn nhìn từ đỉnh núi Thới Lới", "Du khách đi thuyền thúng ra Đảo Bé"],
      "bestTimeToVisit": "Mùa hè từ tháng 6 đến tháng 9, khi thời tiết nắng đẹp và biển lặng.",
      "essentialTips": ["Nên đi tàu ra Đảo Bé để trải nghiệm lặn ngắm san hô.", "Thử món gỏi tỏi, một đặc sản độc đáo của Lý Sơn.", "Hãy tôn trọng văn hóa và lịch sử của hòn đảo."]
    },
    {
      "name": "Thành phố Hồ Chí Minh",
      "slug": "ho-chi-minh-city",
      "description": "Là trung tâm kinh tế năng động và lớn nhất Việt Nam, Thành phố Hồ Chí Minh (còn gọi là Sài Gòn) là một đô thị không bao giờ ngủ với những tòa nhà chọc trời, những khu chợ sầm uất và một cuộc sống về đêm sôi động.",
      "history": "Lịch sử thành phố gắn liền với cuộc chiến tranh Việt Nam, được ghi dấu tại các địa điểm như Dinh Độc Lập, Bảo tàng Chứng tích Chiến tranh và Địa đạo Củ Chi.",
      "culture": "Văn hóa Sài Gòn là sự pha trộn đa dạng của nhiều vùng miền và quốc gia, thể hiện qua ẩm thực phong phú, từ những gánh hàng rong cho đến những nhà hàng sang trọng.",
      "geography": "Nằm ở phía Nam Việt Nam, thành phố này là một trung tâm đô thị lớn bên sông Sài Gòn.",
      "mainImage": "Toàn cảnh trung tâm Quận 1, TP.HCM về đêm với tòa nhà Bitexco",
      "imageGallery": ["Dinh Độc Lập, một di tích lịch sử quan trọng", "Nhà thờ Đức Bà và Bưu điện Trung tâm Sài Gòn", "Chợ Bến Thành, một biểu tượng của thành phố"],
      "bestTimeToVisit": "Mùa khô từ tháng 12 đến tháng 4.",
      "essentialTips": ["Khám phá thành phố bằng xe máy để có trải nghiệm chân thực nhất.", "Thưởng thức cà phê sữa đá và ẩm thực đường phố.", "Hãy cẩn thận với đồ đạc cá nhân khi ở những nơi đông người."]
    },
    {
      "name": "Đồng bằng sông Cửu Long",
      "slug": "mekong-delta",
      "description": "Được mệnh danh là 'vựa lúa' của Việt Nam, Đồng bằng sông Cửu Long là một vùng sông nước mênh mông với những khu chợ nổi tấp nập, những vườn cây ăn trái trĩu quả và cuộc sống bình dị của người dân miền Tây.",
      "history": "Đây là vùng đất mới được khai phá, với lịch sử gắn liền với công cuộc Nam tiến của người Việt.",
      "culture": "Văn hóa sông nước đặc trưng với phương tiện di chuyển chính là ghe, xuồng. Chợ nổi là một nét văn hóa độc đáo, nơi mọi hoạt động mua bán diễn ra trên sông.",
      "geography": "Là vùng hạ lưu của sông Mê Kông, khu vực này có một mạng lưới sông ngòi, kênh rạch chằng chịt.",
      "mainImage": "Chợ nổi Cái Răng, Cần Thơ tấp nập ghe thuyền vào buổi sáng",
      "imageGallery": ["Một chiếc xuồng nhỏ chở du khách len lỏi qua các con rạch nhỏ", "Những vườn cây ăn trái trĩu quả ở miền Tây", "Người dân địa phương mặc áo bà ba chèo thuyền"],
      "bestTimeToVisit": "Mùa khô (tháng 12 - tháng 4) hoặc mùa nước nổi (tháng 9 - tháng 11).",
      "essentialTips": ["Hãy đi chợ nổi vào sáng sớm để trải nghiệm không khí nhộn nhịp nhất.", "Thưởng thức các loại trái cây tươi ngon ngay tại vườn.", "Ở tại một homestay ven sông để tìm hiểu về cuộc sống của người dân địa phương."]
    },
    {
      "name": "Phú Quốc",
      "slug": "phu-quoc-island",
      "description": "Phú Quốc, hay còn được mệnh danh là 'Đảo Ngọc', là hòn đảo lớn nhất Việt Nam. Nơi đây thu hút du khách bởi những bãi biển cát trắng mịn trải dài, làn nước biển trong xanh và các khu nghỉ dưỡng sang trọng.",
      "history": "Trong quá khứ, Phú Quốc được biết đến với nhà tù và ngành sản xuất nước mắm. Ngày nay, hòn đảo đã phát triển để trở thành một thiên đường du lịch.",
      "culture": "Văn hóa đảo gắn liền với biển cả, thể hiện qua các làng chài, cuộc sống của ngư dân và các sản vật nổi tiếng như nước mắm, hồ tiêu, và ngọc trai.",
      "geography": "Nằm trong Vịnh Thái Lan, đảo Phú Quốc có địa hình đa dạng bao gồm rừng, núi và các bãi biển đẹp.",
      "mainImage": "Bãi Sao, Phú Quốc với bãi cát trắng mịn như kem và hàng dừa xanh mát",
      "imageGallery": ["Cáp treo Hòn Thơm vượt biển dài nhất thế giới", "Hoàng hôn tím lãng mạn trên biển tại Dinh Cậu", "Vườn tiêu xanh bạt ngàn, một đặc sản của Phú Quốc"],
      "bestTimeToVisit": "Mùa khô từ tháng 11 đến tháng 4 năm sau.",
      "essentialTips": ["Khám phá Bắc đảo để thăm vườn tiêu và nhà thùng nước mắm.", "Dành thời gian ở Nam đảo để tắm biển tại Bãi Sao và đi cáp treo Hòn Thơm.", "Thưởng thức hải sản tươi ngon tại chợ đêm Dinh Cậu."]
    },
    {
      "name": "Đà Lạt",
      "slug": "da-lat",
      "description": "Được mệnh danh là 'Thành phố Ngàn hoa' hay 'Paris thu nhỏ', Đà Lạt là một thành phố nghỉ dưỡng trên cao nguyên với khí hậu mát mẻ quanh năm, những rừng thông, thác nước và các biệt thự kiến trúc Pháp.",
      "history": "Đà Lạt được người Pháp phát hiện và xây dựng thành một khu nghỉ dưỡng vào đầu thế kỷ 20.",
      "culture": "Văn hóa Đà Lạt là sự pha trộn giữa văn hóa của người dân tộc bản địa và ảnh hưởng từ Pháp, tạo nên một phong cách sống chậm rãi, lãng mạn.",
      "geography": "Nằm trên cao nguyên Lâm Viên, Đà Lạt có độ cao khoảng 1.500 mét so với mực nước biển.",
      "mainImage": "Hồ Xuân Hương thơ mộng vào buổi sáng sớm ở trung tâm Đà Lạt",
      "imageGallery": ["Ga xe lửa Đà Lạt, một công trình kiến trúc cổ độc đáo", "Thác Datanla với hệ thống máng trượt xuyên rừng", "Những vườn hoa đầy màu sắc ở Đà Lạt"],
      "bestTimeToVisit": "Mùa khô từ tháng 11 đến tháng 3.",
      "essentialTips": ["Hãy thử các món ăn đường phố đặc trưng như bánh tráng nướng và sữa đậu nành nóng.", "Thuê xe máy để khám phá các điểm tham quan ở ngoại ô.", "Mang theo áo ấm vì thời tiết có thể lạnh vào buổi tối."]
    },
    {
      "name": "Mũi Né",
      "slug": "mui-ne",
      "description": "Mũi Né là một thị trấn ven biển nổi tiếng với những đồi cát đỏ và trắng khổng lồ, những hàng dừa cong vút và là một trung tâm của các môn thể thao dưới nước như lướt ván diều.",
      "history": "Từ một làng chài yên tĩnh, Mũi Né đã phát triển thành một địa điểm du lịch nổi tiếng.",
      "culture": "Văn hóa làng chài vẫn còn hiện hữu, cùng với đó là văn hóa của người Chăm với các tháp Pô Sah Inư.",
      "geography": "Nằm ở tỉnh Bình Thuận, Mũi Né có khí hậu khô và nhiều nắng, tạo nên cảnh quan đồi cát độc đáo.",
      "mainImage": "Đồi Cát Đỏ ở Mũi Né vào lúc bình minh hoặc hoàng hôn",
      "imageGallery": ["Suối Tiên, một dòng suối nhỏ đi bộ giữa những nhũ đá màu đỏ và trắng", "Những chiếc thuyền thúng đầy màu sắc của ngư dân tại làng chài Mũi Né", "Người chơi lướt ván diều trên biển"],
      "bestTimeToVisit": "Mùa khô từ tháng 12 đến tháng 4.",
      "essentialTips": ["Hãy thuê xe jeep để khám phá Đồi Cát Trắng và Đồi Cát Đỏ.", "Thử trượt cát, một hoạt động thú vị trên các đồi cát.", "Thưởng thức hải sản tươi sống tại các nhà hàng ven biển."]
    },
    {
      "name": "Côn Đảo",
      "slug": "con-dao-islands",
      "description": "Côn Đảo là một quần đảo hoang sơ và linh thiêng, nổi tiếng với những bãi biển đẹp, hệ sinh thái biển đa dạng và một quá khứ lịch sử bi tráng với hệ thống nhà tù Côn Đảo.",
      "history": "Nơi đây từng được mệnh danh là 'địa ngục trần gian' với hệ thống nhà tù tàn bạo do thực dân Pháp và đế quốc Mỹ xây dựng. Đây cũng là nơi yên nghỉ của nữ anh hùng Võ Thị Sáu.",
      "culture": "Văn hóa Côn Đảo là sự kết hợp giữa tâm linh, lịch sử và cuộc sống của người dân trên đảo.",
      "geography": "Là một quần đảo gồm 16 hòn đảo lớn nhỏ, Côn Đảo có Vườn quốc gia Côn Đảo bảo tồn nhiều loài sinh vật biển quý hiếm, bao gồm cả rùa biển.",
      "mainImage": "Bãi Đầm Trầu, một trong những bãi biển đẹp nhất Côn Đảo",
      "imageGallery": ["Nhà tù Côn Đảo và các di tích lịch sử", "Rùa biển lên bờ đẻ trứng vào ban đêm", "Toàn cảnh Côn Đảo nhìn từ trên cao"],
      "bestTimeToVisit": "Mùa khô từ tháng 12 đến tháng 4.",
      "essentialTips": ["Hãy đi viếng mộ cô Sáu vào ban đêm, một hoạt động tâm linh quan trọng.", "Thuê xe máy để khám phá quanh đảo.", "Tham gia tour lặn biển để ngắm san hô và xem rùa biển (nếu đúng mùa)."]
    },
    {
      "name": "Nha Trang",
      "slug": "nha-trang",
      "description": "Nha Trang là một thành phố biển sôi động, nổi tiếng với vịnh biển được xếp vào hàng đẹp nhất thế giới, các hòn đảo nhiệt đới, các hoạt động lặn biển và một cuộc sống về đêm nhộn nhịp.",
      "history": "Nha Trang có một lịch sử lâu đời gắn liền với vương quốc Champa, với Tháp Bà Ponagar là một di tích tiêu biểu.",
      "culture": "Văn hóa biển hiện đại với nhiều hoạt động giải trí, thể thao dưới nước và ẩm thực hải sản.",
      "geography": "Thành phố nằm trong một vịnh biển kín gió, được bao quanh bởi các hòn đảo.",
      "mainImage": "Toàn cảnh vịnh Nha Trang với các hòn đảo và thành phố ven biển",
      "imageGallery": ["Tháp Bà Ponagar, một công trình kiến trúc Chăm Pa cổ", "Du khách lặn biển ngắm san hô ở Hòn Mun", "VinWonders Nha Trang trên đảo Hòn Tre"],
      "bestTimeToVisit": "Mùa khô từ tháng 1 đến tháng 8.",
      "essentialTips": ["Tham gia tour 4 đảo để khám phá các hòn đảo đẹp nhất.", "Thử tắm bùn khoáng, một trải nghiệm thư giãn độc đáo.", "Thưởng thức đặc sản nem nướng Ninh Hòa và bún chả cá."]
    },
    {
      "name": "Vũng Tàu",
      "slug": "vung-tau",
      "description": "Là một thành phố biển gần Thành phố Hồ Chí Minh, Vũng Tàu là điểm đến cuối tuần quen thuộc với những bãi biển, ngọn hải đăng cổ và Tượng Chúa Kitô Vua trên đỉnh núi Nhỏ.",
      "history": "Vũng Tàu có lịch sử là một cảng thương mại quan trọng và là nơi nghỉ dưỡng của người Pháp.",
      "culture": "Văn hóa biển với các hoạt động du lịch và ẩm thực hải sản.",
      "geography": "Thành phố có ba mặt giáp biển, với các bãi biển chính là Bãi Trước và Bãi Sau.",
      "mainImage": "Tượng Chúa Kitô Vua giang tay nhìn ra biển từ trên đỉnh núi Nhỏ",
      "imageGallery": ["Ngọn hải đăng Vũng Tàu, một trong những ngọn hải đăng cổ nhất Việt Nam", "Bãi Sau với bờ biển dài và đông đúc du khách", "Mũi Nghinh Phong, nơi có tầm nhìn đẹp ra biển"],
      "bestTimeToVisit": "Mùa khô từ tháng 11 đến tháng 4.",
      "essentialTips": ["Leo lên Tượng Chúa và ngọn hải đăng để ngắm toàn cảnh thành phố.", "Thưởng thức bánh khọt và hải sản tươi sống.", "Hãy đi vào các ngày trong tuần để tránh đông đúc."]
    }
]


// Load environment variables (prefer project root .env.local if present)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function seedDestinations() {
  try {
    await dbConnect();
    console.log('🔌 Database connected');

    // 1) Idempotency: clear the collection
    await Destination.deleteMany({});
    console.log('🧹 Cleared existing destinations');

    // 2) Read data file
    const dataPath = path.join(__dirname, 'data', 'destinations.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const destinations = JSON.parse(fileContent);
    if (!Array.isArray(destinations)) {
      throw new Error('destinations.json must export a JSON array');
    }
    console.log(`📦 Found ${destinations.length} destinations`);

    // 3) Efficient bulk insert
    await Destination.insertMany(destinations, { ordered: true });
    console.log('✅ Seeded destinations successfully');
  } catch (error) {
    console.error('❌ Error seeding destinations:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

seedDestinations();




