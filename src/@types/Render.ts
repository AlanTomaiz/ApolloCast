export interface IDevice {
  host: string;
  name: string;
  type: string;
}

export interface IService {
  addresses: string[];
  port: number;
  txt: {
    fn: string;
    md: string;
  };
}
