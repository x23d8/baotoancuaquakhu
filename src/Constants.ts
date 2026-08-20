/*
 * Museum model resources
 */
export const COLLISION_SCENE_URL = new URL("./assets/models/scene_collision.glb", import.meta.url).href;
export const STATIC_SCENE_URL = new URL("./assets/models/scene_desk_obj.glb", import.meta.url).href;

export type SourceLink = {
	label: string;
	url: string;
};

export type ExhibitInfo = {
	slot: number;
	order: number;
	period: string;
	stage: string;
	title: string;
	date: string;
	location: string;
	image: string;
	imageAlt: string;
	imageCaption: string;
	imageCredit: string;
	describe: string;
	textbook: string;
	claimIds: string;
	sources: SourceLink[];
	relatedImages?: Array<{
		src: string;
		alt: string;
		caption: string;
		credit: string;
	}>;
};

const VNA_VIII = "https://vnanet.vn/vi/anh/anh-chuyen-de-1053/dai-hoi-lan-thu-viii-cua-dang-tiep-tuc-doi-moi-day-manh-cong-nghiep-hoa-hien-dai-hoa-dat-nuoc-5244897.html";
const VNA_IX = "https://vnanet.vn/vi/anh/anh-chuyen-de-1053/dai-hoi-lan-thu-ix-cua-dang-phat-huy-suc-manh-toan-dan-toc-day-manh-cong-nghiep-hoa-hien-dai-hoa-5247278.html";
const VNA_X = "https://nvsk.vnanet.vn/dai-hoi-dai-bieu-toan-quoc-lan-thu-x-cua-dang-1-112609.vna";
const VNA_WTO = "https://vnanet.vn/vi/anh/anh-chuyen-de-1053/ky-niem-12-nam-ngay-viet-nam-gia-nhap-wto-1112007---1112019-3668075.html";
const VNA_APEC = "https://nvsk.vnanet.vn/hoi-nghi-cap-cao-apec-14-to-chuc-tai-ha-noi-nam-2006-1-135656.vna";
const PARTY_VIII = "https://tulieuvankien.dangcongsan.vn/print/12/nien-bieu-toan-khoa";
const PARTY_IX = "https://tulieuvankien.dangcongsan.vn/ban-chap-hanh-trung-uong-dang/dai-hoi-dang/lan-thu-ix/dai-hoi-dai-bieu-toan-quoc-lan-thu-ix-cua-dang-11";
const MOJ_NQ36 = "https://vbpl.moj.gov.vn/longan/Pages/vbpq-toanvan.aspx?ItemID=50642";
const GOV_WTO = "https://baochinhphu.vn/viet-nam-chinh-thuc-tro-thanh-thanh-vien-cua-to-chuc-thuong-mai-lon-nhat-hanh-tinh-wto-10210286.htm";

const image = (name: string) => new URL(`./assets/history/${name}`, import.meta.url).href;

/*
 * The physical frame numbers form a route through the original 3D model:
 * 1 → 3 → 2 → 9 → 4 → 5 → 6 → 7 → 10 → 8.
 * Keeping that route lets the chronology advance through both depth and width.
 */
export const EXHIBITS: ExhibitInfo[] = [
	{
		slot: 1,
		order: 1,
		period: "1996",
		stage: "P2 · Mở thời kỳ mới",
		title: "Đại hội VIII: bước ngoặt đẩy mạnh CNH–HĐH",
		date: "28/6–1/7/1996",
		location: "Hà Nội",
		image: image("01-dai-hoi-viii.jpg"),
		imageAlt: "Quang cảnh Đại hội đại biểu toàn quốc lần thứ VIII của Đảng tại Hà Nội",
		imageCaption: "Đại hội đại biểu toàn quốc lần thứ VIII của Đảng tại Hà Nội.",
		imageCredit: "Ảnh tư liệu: TTXVN",
		describe: `<p>Sau 10 năm đổi mới, Đại hội VIII đánh giá nhiệm vụ chuẩn bị tiền đề cho công nghiệp hóa đã cơ bản hoàn thành, cho phép chuyển sang thời kỳ mới <strong>đẩy mạnh công nghiệp hóa, hiện đại hóa</strong>.</p><p>Sáu quan điểm được giáo trình hệ thống gồm: độc lập, tự chủ đi cùng mở rộng quan hệ quốc tế; CNH–HĐH là sự nghiệp toàn dân; phát huy nguồn lực con người; khoa học và công nghệ là động lực; lấy hiệu quả kinh tế làm chuẩn; kết hợp kinh tế với quốc phòng, an ninh.</p><p class="interpretation"><b>Chuyển dịch trọng tâm:</b> từ tạo tiền đề sang tổ chức CNH–HĐH trên quy mô rộng.</p>`,
		textbook: "Giáo trình Lịch sử Đảng Cộng sản Việt Nam (2019), PDF tr. 141–142; trang in 140–141.",
		claimIds: "SV-01, SV-02",
		sources: [
			{label: "Niên biểu Đại hội VIII · Tư liệu Văn kiện Đảng", url: PARTY_VIII},
			{label: "Bộ ảnh Đại hội VIII · TTXVN", url: VNA_VIII}
		]
	},
	{
		slot: 3,
		order: 2,
		period: "12/1996",
		stage: "P2 · Nền tảng tri thức",
		title: "Giáo dục, khoa học và công nghệ là quốc sách hàng đầu",
		date: "Tháng 12/1996",
		location: "Hội nghị Trung ương 2 khóa VIII",
		image: image("02-dai-hoc-quoc-gia.jpg"),
		imageAlt: "Tổng Bí thư Lê Khả Phiêu thăm Đại học Quốc gia Hà Nội năm 2000",
		imageCaption: "Tổng Bí thư Lê Khả Phiêu thăm Đại học Quốc gia Hà Nội, ngày 19/8/2000. Ảnh dùng để minh họa bối cảnh phát triển nguồn nhân lực của giai đoạn, không phải ảnh Hội nghị Trung ương 2.",
		imageCredit: "Ảnh: Cao Phong – TTXVN",
		describe: `<p>Hội nghị Trung ương 2 khóa VIII ban hành hai nghị quyết quan trọng, nhấn mạnh giáo dục–đào tạo cùng khoa học và công nghệ là quốc sách hàng đầu, là nhân tố quyết định tăng trưởng kinh tế và phát triển xã hội.</p><p class="interpretation"><b>Ý nghĩa:</b> hiện đại hóa không chỉ là máy móc và công trình; năng lực con người và khoa học–công nghệ trở thành nền móng của CNH–HĐH.</p>`,
		textbook: "Giáo trình, PDF tr. 145; trang in 144.",
		claimIds: "SV-03",
		sources: [{label: "Bộ ảnh giai đoạn Đại hội VIII · TTXVN", url: VNA_VIII}]
	},
	{
		slot: 2,
		order: 3,
		period: "1997–2000",
		stage: "P3 · Năng lực thực thi",
		title: "CNH–HĐH trong biến động tài chính khu vực",
		date: "Từ tháng 7/1997 đến năm 2000",
		location: "Việt Nam trong khủng hoảng tài chính châu Á",
		image: image("03-cau-my-thuan.jpg"),
		imageAlt: "Cầu Mỹ Thuận hoàn thành tháng 5 năm 2000",
		imageCaption: "Cầu Mỹ Thuận hoàn thành tháng 5/2000, một hiện vật ảnh về năng lực hạ tầng ở cuối giai đoạn.",
		imageCredit: "Ảnh: An Hiếu – TTXVN",
		describe: `<p>Khủng hoảng tài chính–tiền tệ khu vực từ tháng 7/1997 đặt đường lối trước phép thử thực thi. Trọng tâm là phát huy nội lực, nâng hiệu quả hợp tác quốc tế và sức cạnh tranh; chuyển dịch cơ cấu; hiện đại hóa nông nghiệp, nông thôn; hướng mạnh về xuất khẩu nhưng không coi nhẹ thị trường trong nước.</p><p>Đến năm 2000, giáo trình ghi nhận GDP tăng bình quân khoảng 7%/năm và giá trị sản xuất công nghiệp tăng bình quân 13,5%/năm.</p><p class="interpretation"><b>Lưu ý học thuật:</b> số liệu mô tả kết quả toàn giai đoạn, không tự chứng minh quan hệ nhân quả với riêng một công trình hay nghị quyết.</p>`,
		textbook: "Giáo trình, PDF tr. 143; trang in 142.",
		claimIds: "SV-04, SV-05",
		sources: [{label: "Bộ ảnh 1996–2000 · TTXVN", url: VNA_VIII}]
	},
	{
		slot: 9,
		order: 4,
		period: "2001",
		stage: "P4 · Thể chế và hội nhập",
		title: "Đại hội IX: định hình mô hình kinh tế tổng quát",
		date: "19–22/4/2001",
		location: "Hà Nội",
		image: image("04-dai-hoi-ix.jpg"),
		imageAlt: "Đại hội đại biểu toàn quốc lần thứ IX của Đảng tại Hà Nội",
		imageCaption: "Đại hội đại biểu toàn quốc lần thứ IX của Đảng tại Hà Nội.",
		imageCredit: "Ảnh: TTXVN",
		describe: `<p>Đại hội IX thông qua Chiến lược phát triển kinh tế–xã hội 2001–2010 và xác định <strong>kinh tế thị trường định hướng xã hội chủ nghĩa</strong> là mô hình kinh tế tổng quát của thời kỳ quá độ.</p><p>Đường lối đối ngoại được diễn đạt là mở rộng quan hệ đối ngoại, <strong>chủ động hội nhập kinh tế quốc tế</strong>.</p><p class="interpretation"><b>Chuyển dịch trọng tâm:</b> CNH–HĐH tiếp tục được kế thừa, đồng thời có thêm trục thể chế và tư thế hội nhập chủ động.</p>`,
		textbook: "Giáo trình, PDF tr. 147–149; trang in 146–148.",
		claimIds: "SV-06 đến SV-09",
		sources: [
			{label: "Đại hội IX · Tư liệu Văn kiện Đảng", url: PARTY_IX},
			{label: "Bộ ảnh Đại hội IX · TTXVN", url: VNA_IX}
		]
	},
	{
		slot: 4,
		order: 5,
		period: "2001–2002",
		stage: "P5 · Cụ thể hóa thể chế",
		title: "Từ chiến lược đến năng lực sản xuất",
		date: "Tháng 9/2001–2002",
		location: "Các chủ trương đầu khóa IX",
		image: image("05-thuy-dien-yaly.jpg"),
		imageAlt: "Nhà máy thủy điện Yaly khánh thành năm 2002",
		imageCaption: "Nhà máy thủy điện Yaly khánh thành ngày 27/4/2002. Ảnh là lát cắt hạ tầng của giai đoạn, không được dùng để quy kết kết quả cho một nghị quyết riêng lẻ.",
		imageCredit: "Ảnh tư liệu: TTXVN",
		describe: `<p>Hội nghị Trung ương 3 khóa IX tháng 9/2001 chỉ đạo sắp xếp, đổi mới, phát triển và nâng cao hiệu quả doanh nghiệp nhà nước trong bối cảnh đẩy mạnh CNH–HĐH và hội nhập.</p><p>Tháng 3/2002, Hội nghị Trung ương 5 khóa IX xác định kinh tế tư nhân là bộ phận cấu thành quan trọng của nền kinh tế quốc dân và phát triển kinh tế tư nhân là vấn đề chiến lược lâu dài.</p><p class="interpretation"><b>Câu hỏi trọng tâm:</b> không chỉ “phát triển cái gì” mà còn “chủ thể nào tham gia và hoạt động hiệu quả ra sao”.</p>`,
		textbook: "Giáo trình, PDF tr. 149–150; trang in 148–149.",
		claimIds: "SV-10 và phần 5.1 hồ sơ tổng hợp",
		sources: [{label: "Bộ ảnh giai đoạn Đại hội IX · TTXVN", url: VNA_IX}]
	},
	{
		slot: 5,
		order: 6,
		period: "2002–2003",
		stage: "P5 · Mở rộng chủ thể",
		title: "Doanh nghiệp và các thành phần kinh tế",
		date: "2002–2003",
		location: "Triển khai các nghị quyết khóa IX",
		image: image("07-det-nam-dinh.jpg"),
		imageAlt: "Sản xuất sợi tại Công ty Dệt Nam Định năm 2004",
		imageCaption: "Sản xuất sợi chất lượng cao tại Công ty Dệt Nam Định năm 2004, ảnh tư liệu minh họa môi trường sản xuất và yêu cầu nâng hiệu quả.",
		imageCredit: "Ảnh: Cẩm Bình – TTXVN",
		describe: `<p>Khung kinh tế thị trường định hướng XHCN được cụ thể hóa bằng việc vừa yêu cầu khu vực doanh nghiệp nhà nước nâng hiệu quả, vừa nhìn nhận kinh tế tư nhân là bộ phận cấu thành quan trọng, cần phát triển lâu dài.</p><p class="interpretation"><b>Chuyển dịch trọng tâm:</b> từ xác lập mô hình ở Đại hội IX sang tổ chức vận hành nhiều chủ thể trong mô hình đó.</p>`,
		textbook: "Giáo trình, PDF tr. 149–150; trang in 148–149.",
		claimIds: "SV-10",
		sources: [{label: "Bộ ảnh giai đoạn Đại hội IX · TTXVN", url: VNA_IX}]
	},
	{
		slot: 6,
		order: 7,
		period: "2003",
		stage: "P5 · Khai thông nguồn lực",
		title: "Đất đai: nguồn nội lực và nguồn vốn lớn",
		date: "Tháng 3/2003",
		location: "Hội nghị Trung ương 7 khóa IX",
		image: image("06-co-gioi-hoa-nong-nghiep.jpg"),
		imageAlt: "Cơ giới hóa sản xuất lúa ở Gia Lai năm 2004",
		imageCaption: "Sử dụng máy cơ giới trong canh tác và sản xuất lúa ở Đắk Đoa, Gia Lai, năm 2004. Ảnh tư liệu minh họa việc tổ chức nguồn lực đất đai và sản xuất nông nghiệp.",
		imageCredit: "Ảnh: Sỹ Huynh – TTXVN",
		describe: `<p>Hội nghị Trung ương 7 khóa IX xác định đất đai là tài nguyên quốc gia vô cùng quý giá, tư liệu sản xuất đặc biệt, nguồn nội lực và nguồn vốn to lớn; quyền sử dụng đất là hàng hóa đặc biệt.</p><p class="interpretation"><b>Ý nghĩa:</b> trọng tâm đi từ nêu đường lối sang nhận diện và tổ chức một nguồn lực cụ thể cho CNH–HĐH.</p>`,
		textbook: "Giáo trình, PDF tr. 150–151; trang in 149–150.",
		claimIds: "SV-11",
		sources: [{label: "Bộ ảnh giai đoạn Đại hội IX · TTXVN", url: VNA_IX}]
	},
	{
		slot: 7,
		order: 8,
		period: "2004–2005",
		stage: "P5 · Nguồn lực và không gian hội nhập",
		title: "Mở rộng khái niệm nguồn lực quốc gia",
		date: "26/3/2004–2005",
		location: "Nghị quyết 36 và bối cảnh hội nhập",
		image: image("08-asem-5.jpg"),
		imageAlt: "Hội nghị cấp cao Á Âu lần thứ năm tại Hà Nội năm 2004",
		imageCaption: "Hội nghị cấp cao Á–Âu lần thứ 5 tại Hà Nội, 8–9/10/2004. Ảnh cung cấp bối cảnh đối ngoại của giai đoạn; nội dung Nghị quyết 36 được kiểm chứng riêng bằng văn bản và giáo trình.",
		imageCredit: "Ảnh: TTXVN",
		describe: `<p>Nghị quyết 36-NQ/TW ngày 26/3/2004 xác định người Việt Nam ở nước ngoài là bộ phận không tách rời và là nguồn lực của cộng đồng dân tộc Việt Nam, đồng thời là nhân tố góp phần tăng cường quan hệ hợp tác, hữu nghị với các nước.</p><p>Trong cùng mạch phát triển, giáo trình nhấn mạnh giữ môi trường hòa bình, xây dựng nền kinh tế độc lập, tự chủ đồng thời chủ động hội nhập kinh tế quốc tế.</p><p class="interpretation"><b>Chuyển dịch trọng tâm:</b> khái niệm nguồn lực được mở rộng cả về chủ thể lẫn không gian kết nối.</p>`,
		textbook: "Giáo trình, PDF tr. 153–154; trang in 152–153. Ngày ban hành được đối chiếu CSDL quốc gia về văn bản pháp luật.",
		claimIds: "SV-12",
		sources: [
			{label: "Nghị quyết 36-NQ/TW · CSDL Bộ Tư pháp", url: MOJ_NQ36},
			{label: "Ảnh bối cảnh 2004 · TTXVN", url: VNA_IX}
		]
	},
	{
		slot: 10,
		order: 9,
		period: "2006",
		stage: "P6 · Đổi mới toàn diện",
		title: "Đại hội X: tri thức, chất lượng và chiều sâu",
		date: "18–25/4/2006",
		location: "Hà Nội",
		image: image("09-dai-hoi-x.jpg"),
		imageAlt: "Khai mạc Đại hội đại biểu toàn quốc lần thứ X của Đảng",
		imageCaption: "Khai mạc Đại hội đại biểu toàn quốc lần thứ X của Đảng.",
		imageCredit: "Ảnh tư liệu: TTXVN",
		describe: `<p>Đại hội X đặt nhiệm vụ tiếp tục hoàn thiện thể chế kinh tế thị trường định hướng XHCN; đẩy mạnh CNH–HĐH <strong>gắn với phát triển kinh tế tri thức</strong>; mở rộng quan hệ đối ngoại, <strong>chủ động, tích cực hội nhập kinh tế quốc tế</strong>.</p><p class="interpretation"><b>Điểm cần phân biệt:</b> “kinh tế tri thức” xuất hiện trong bối cảnh Đại hội IX, nhưng công thức “CNH–HĐH gắn với phát triển kinh tế tri thức” được giáo trình nêu trực tiếp ở phần Đại hội X.</p>`,
		textbook: "Giáo trình, PDF tr. 154–156; trang in 153–155.",
		claimIds: "SV-14, SV-15",
		sources: [{label: "Hồ sơ ảnh Đại hội X · TTXVN", url: VNA_X}]
	},
	{
		slot: 8,
		order: 10,
		period: "11/2006",
		stage: "P6 · Hội nhập đa phương",
		title: "WTO và APEC 14: điểm kết của hành trình",
		date: "7–19/11/2006",
		location: "Geneva và Hà Nội",
		image: image("10-wto.jpg"),
		imageAlt: "Lễ trao văn kiện kết nạp Việt Nam vào WTO ngày 7 tháng 11 năm 2006",
		imageCaption: "Tổng Giám đốc WTO Pascal Lamy trao văn kiện kết nạp Việt Nam cho Bộ trưởng Thương mại Trương Đình Tuyển, ngày 7/11/2006 tại Geneva.",
		imageCredit: "Ảnh: AFP/TTXVN phát",
		describe: `<p>Tháng 11/2006, sau hơn 10 năm đàm phán, Việt Nam được kết nạp là thành viên thứ 150 của WTO. Cũng trong tháng này, Việt Nam tổ chức thành công Tuần lễ cấp cao APEC lần thứ 14 tại Hà Nội.</p><p class="interpretation"><b>Ý nghĩa trong phạm vi đề tài:</b> hai sự kiện là điểm kết phù hợp cho tiến trình chuyển từ mở rộng quan hệ quốc tế sang hội nhập kinh tế quốc tế sâu hơn và đa phương hơn.</p><p class="interpretation"><b>Giới hạn:</b> bảo tàng dừng ở tháng 11/2006, không dùng các kết quả 2007–2010 làm nội dung chính.</p>`,
		textbook: "Giáo trình, PDF tr. 166–167; trang in 165–166.",
		claimIds: "SV-16, SV-17",
		sources: [
			{label: "Bộ ảnh Việt Nam gia nhập WTO · TTXVN", url: VNA_WTO},
			{label: "Sự kiện WTO ngày 7/11/2006 · Báo Chính phủ", url: GOV_WTO},
			{label: "Hội nghị Cấp cao APEC 14 · TTXVN", url: VNA_APEC}
		],
		relatedImages: [{
			src: image("11-apec-2006.jpg"),
			alt: "Hội nghị Cấp cao APEC lần thứ 14 tại Hà Nội tháng 11 năm 2006",
			caption: "Năm APEC Việt Nam 2006, trọng tâm là Hội nghị Cấp cao diễn ra tại Hà Nội từ 12–19/11/2006.",
			credit: "Ảnh: TTXVN"
		}]
	}
];

export const EXHIBITS_BY_SLOT: Record<string, ExhibitInfo> = Object.fromEntries(
	EXHIBITS.map(exhibit => [String(exhibit.slot), exhibit])
);

/* Official recording of “Tiến quân ca”; source and public-domain declaration:
 * https://commons.wikimedia.org/wiki/File:Quoc_ca_Viet_Nam.ogg
 */
export const AUDIO_URL = new URL("./assets/audio/quoc-ca-viet-nam.ogg", import.meta.url).href;

/* The museum computer is now a Vietnamese historical archive display. */
export const IFRAME_SRC = `${import.meta.env.BASE_URL}archive/index.html`;

export const ON_LOAD_PROGRESS = "on-load-progress";
export const ON_LOAD_MODEL_FINISH = "on-load-model-finish";
export const ON_CLICK_RAY_CAST = "on-click-ray-cast";
export const ON_SHOW_TOOLTIP = "on-show-tooltip";
export const ON_HIDE_TOOLTIP = "on-hide-tooltip";
export const ON_KEY_DOWN = "on-key-down";
export const ON_KEY_UP = "on-key-up";
export const ON_ENTER_APP = "on-enter-app";
export const ON_TOGGLE_AUDIO = "on-toggle-audio";
export const ON_SEND_CHAT = "on-send-chat";
