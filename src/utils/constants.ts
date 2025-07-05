export const IP_ADDRESS = {
  HOME_1: "192.168.1.16",
  NEAR: "192.168.1.133",
  UOG: "10.25.33.122",
  LEEVU: "192.168.158.79",
  Z9_TURBO: "192.168.95.172"
};

export const BACKEND_URL = `http://${IP_ADDRESS.HOME_1}:1310`;
export const CHAT_SOCKET_URL = `${BACKEND_URL}/chat`;
export const DELIVERY_FEE = 3;
export const SERVICE_FEE = 1;
export const MAX_DISTANCE_FROM_SEARCH_RADIUS = 1000;

export const HARDED_CODE_TEST = {
  prioritised_drivers: ["FF_DRI_d561f2ba-b3a8-4190-8221-ec2a86c85010"],
};
