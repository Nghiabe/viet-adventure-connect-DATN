export interface IFlight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: { code: string; city: string };
  destination: { code: string; city: string };
  departureTime: string; // "HH:mm"
  arrivalTime: string; // "HH:mm"
  duration: string; // "Xh Ym"
  price: number;
  stops: number; // 0 for direct
  class: string;
}

export const mockFlights: IFlight[] = [
  { id: 'flight-1', airline: 'Vietnam Airlines', flightNumber: 'VN242', origin: { code: 'SGN', city: 'TP. Hồ Chí Minh' }, destination: { code: 'HAN', city: 'Hà Nội' }, departureTime: '06:00', arrivalTime: '08:15', duration: '2h 15m', price: 2450000, stops: 0, class: 'Economy' },
  { id: 'flight-2', airline: 'VietJet Air', flightNumber: 'VJ150', origin: { code: 'SGN', city: 'TP. Hồ Chí Minh' }, destination: { code: 'HAN', city: 'Hà Nội' }, departureTime: '09:30', arrivalTime: '11:45', duration: '2h 15m', price: 1890000, stops: 0, class: 'Economy' },
  { id: 'flight-3', airline: 'Bamboo Airways', flightNumber: 'QH202', origin: { code: 'SGN', city: 'TP. Hồ Chí Minh' }, destination: { code: 'HAN', city: 'Hà Nội' }, departureTime: '14:20', arrivalTime: '16:35', duration: '2h 15m', price: 2100000, stops: 0, class: 'Economy' },
  { id: 'flight-4', airline: 'Vietnam Airlines', flightNumber: 'VN118', origin: { code: 'HAN', city: 'Hà Nội' }, destination: { code: 'DAD', city: 'Đà Nẵng' }, departureTime: '07:10', arrivalTime: '08:30', duration: '1h 20m', price: 1600000, stops: 0, class: 'Economy' },
  { id: 'flight-5', airline: 'VietJet Air', flightNumber: 'VJ506', origin: { code: 'HAN', city: 'Hà Nội' }, destination: { code: 'DAD', city: 'Đà Nẵng' }, departureTime: '12:45', arrivalTime: '14:05', duration: '1h 20m', price: 990000, stops: 0, class: 'Economy' },
  { id: 'flight-6', airline: 'Bamboo Airways', flightNumber: 'QH151', origin: { code: 'HAN', city: 'Hà Nội' }, destination: { code: 'DAD', city: 'Đà Nẵng' }, departureTime: '18:00', arrivalTime: '19:20', duration: '1h 20m', price: 1250000, stops: 0, class: 'Economy' },
  { id: 'flight-7', airline: 'Vietnam Airlines', flightNumber: 'VN182', origin: { code: 'DAD', city: 'Đà Nẵng' }, destination: { code: 'SGN', city: 'TP. Hồ Chí Minh' }, departureTime: '10:00', arrivalTime: '11:30', duration: '1h 30m', price: 1450000, stops: 0, class: 'Economy' },
  { id: 'flight-8', airline: 'VietJet Air', flightNumber: 'VJ633', origin: { code: 'DAD', city: 'Đà Nẵng' }, destination: { code: 'SGN', city: 'TP. Hồ Chí Minh' }, departureTime: '16:10', arrivalTime: '17:40', duration: '1h 30m', price: 890000, stops: 0, class: 'Economy' },
  { id: 'flight-9', airline: 'Bamboo Airways', flightNumber: 'QH203', origin: { code: 'SGN', city: 'TP. Hồ Chí Minh' }, destination: { code: 'DLI', city: 'Đà Lạt' }, departureTime: '08:00', arrivalTime: '08:55', duration: '0h 55m', price: 760000, stops: 0, class: 'Economy' },
  { id: 'flight-10', airline: 'Vietnam Airlines', flightNumber: 'VN730', origin: { code: 'HAN', city: 'Hà Nội' }, destination: { code: 'CXR', city: 'Nha Trang' }, departureTime: '13:20', arrivalTime: '15:15', duration: '1h 55m', price: 1750000, stops: 0, class: 'Economy' },
  { id: 'flight-11', airline: 'VietJet Air', flightNumber: 'VJ776', origin: { code: 'SGN', city: 'TP. Hồ Chí Minh' }, destination: { code: 'PQC', city: 'Phú Quốc' }, departureTime: '06:30', arrivalTime: '07:35', duration: '1h 05m', price: 820000, stops: 0, class: 'Economy' },
  { id: 'flight-12', airline: 'Bamboo Airways', flightNumber: 'QH152', origin: { code: 'HAN', city: 'Hà Nội' }, destination: { code: 'PQC', city: 'Phú Quốc' }, departureTime: '17:10', arrivalTime: '19:25', duration: '2h 15m', price: 2150000, stops: 0, class: 'Economy' },
  { id: 'flight-13', airline: 'Vietnam Airlines', flightNumber: 'VN320', origin: { code: 'SGN', city: 'TP. Hồ Chí Minh' }, destination: { code: 'DAD', city: 'Đà Nẵng' }, departureTime: '19:00', arrivalTime: '20:30', duration: '1h 30m', price: 1500000, stops: 0, class: 'Economy' },
  { id: 'flight-14', airline: 'VietJet Air', flightNumber: 'VJ264', origin: { code: 'SGN', city: 'TP. Hồ Chí Minh' }, destination: { code: 'HAN', city: 'Hà Nội' }, departureTime: '21:15', arrivalTime: '23:30', duration: '2h 15m', price: 1750000, stops: 0, class: 'Economy' },
  { id: 'flight-15', airline: 'Bamboo Airways', flightNumber: 'QH225', origin: { code: 'CXR', city: 'Nha Trang' }, destination: { code: 'HAN', city: 'Hà Nội' }, departureTime: '11:10', arrivalTime: '13:05', duration: '1h 55m', price: 1690000, stops: 0, class: 'Economy' },
  { id: 'flight-16', airline: 'Vietnam Airlines', flightNumber: 'VN155', origin: { code: 'DAD', city: 'Đà Nẵng' }, destination: { code: 'HAN', city: 'Hà Nội' }, departureTime: '06:40', arrivalTime: '08:00', duration: '1h 20m', price: 1580000, stops: 0, class: 'Economy' },
];


