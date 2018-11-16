import axios from 'axios'
import { Message,Notice } from 'iview'
import store from '@/store'
import router from '@/router'


// 创建axios实例
axios.defaults.withCredentials = true // 表示跨域请求时是否需要使用凭证
const service = axios.create({
  baseURL: process.env.BASE_API, // api的base_url  '/gorilla'
  // 允许在向服务器发送前，修改请求数据
  transformRequest:[function (data) {
    if (data instanceof URLSearchParams) {
       return data.toString();
    }
    if(data){
      let keys2 = Object.keys(data);
      let params = [];
      keys2.forEach(function(item){
          if(typeof data[item] != 'undefined'&& data[item] !='null'&&data[item]!=null){
            params.push(item+"="+data[item])
          }
      });
      return encodeURI(params.join('&'));
    }
   
  }],
  timeout: 15000                  // 请求超时时间，如果请求话费了超过 `timeout` 的时间，请求将被中断
})


// 添加请求拦截器，在请求或响应被 then 或 catch 处理前拦截它们
// request拦截器
service.interceptors.request.use(config => {
  if (store.getters.token) {
    config.headers['X-Token'] = getToken() // 让每个请求携带自定义token 请根据实际情况自行修改
  }
  return config
}, error => {
  // Do something with request error
  console.log(error) // for debug
  Promise.reject(error)
})
// 添加响应拦截器
// respone拦截器
service.interceptors.response.use(
  response => {
  /**
  * code为非20000是抛错 可结合自己业务进行修改
  */
    const res = response.data
    if (res.code !== 1) {
      if(res.code==1001||res.code==1004){     

          store.dispatch('FedLogOut').then(() => {
              router.push("/login")
          })    
         
      }else{//热门商铺达到上限8009
        if(res.code<2000&&res.code>0){
            return res
        }else{
            Message.destroy();
            Message.error({content:store.state.errorMsg[res.code]||res.code,duration:2})
            return Promise.reject(res)
        }         
      }
    }else{
        return res
    } 
  },
  error => {
    console.log('err' + error)// for debug
    Message.destroy();
    Message.error({
      content:"服务错误,请稍后重试！",
      duration:2
    })
    return Promise.reject(error)
  }
)

export default service
