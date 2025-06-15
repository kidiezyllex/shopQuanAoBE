import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import dayjs from 'dayjs';
const utc = require('dayjs/plugin/utc.js');
const timezone = require('dayjs/plugin/timezone.js');

dayjs.extend(utc);
dayjs.extend(timezone);

const vnpay = require('vnpay');
const { ProductCode, VnpLocale, dateFormat } = vnpay;

export { dateFormat, ProductCode, VnpLocale };
export default vnpay; 