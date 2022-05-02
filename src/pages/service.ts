import md5 from 'blueimp-md5';
import { Answer } from './constant';

const showPwd = () => {
  const password = prompt('请输入密码', '');

  if (password) {
    const repwd = md5(password);
    if (md5(repwd) === Answer) {
      localStorage.setItem('pwd', repwd);
      return;
    }
  }
  showPwd();
};

const cachePwd = localStorage.getItem('pwd');

if (!cachePwd || md5(cachePwd) !== Answer) {
  showPwd();
}
