import { Input, Form, Select, InputNumber, Button } from 'antd';
import { useEffect, useState } from 'react';
import styles from './index.less';

const { TextArea } = Input;

const A4 = {
  w: 210,
  h: 297
}

const CacheKey = 'PRINT_SETTINGS';

export default function IndexPage() {

  const [settings, setSettings] = useState({});

  const onFinish = (values: { width: number, height: number, text: string; }) => {
    console.log('Success:', values);
    const { width, height, text } = values;
    const content = String.prototype.trim.call(text);
    const columns = Math.floor(A4.w / width);
    const rows = Math.floor(A4.h / height);
    const pageSize = Math.ceil(content.length / (columns * rows));
    
    console.log('content', content);
    console.log('rows', rows);
    console.log('columns', columns);
    console.log('pageSize', pageSize);

    const configuration = {
      rows,columns,pageSize,text: content,width,height
    };
    setSettings(configuration);

    localStorage.setItem(CacheKey, JSON.stringify(configuration));

  };

  useEffect(() => {
    try{
      const configuration = JSON.parse(localStorage.getItem(CacheKey) as string);
      setSettings(configuration);
    }catch(e){
    }
  }, []);
  
  const onFinishFailed = (errorInfo: any) => {
  };
  
  console.log('settings:', settings);

  const { columns = 0, height=0, width=0, rows = 0, pageSize=0, text='' } = (settings || {}) as any;

  const sizePerPage = columns * rows;

  const getTextIndex = (pageIdx: number, row: number, col: number) => {
    return pageIdx*sizePerPage + col * rows + row;
  }
  return (
    <div className={styles.root}>
      <div className={styles.settings}>
      <h1 className={styles.title}>文字打印 隶书</h1>
      <Form
      name="basic"
      initialValues={{width: 30, height: 20, text: '故人西辞黄鹤楼夜来风雨声花落知多少满纸荒唐言一把辛酸泪都云作者痴谁解其中味客亦知夫水与月乎？逝者如斯，而未尝往也；盈虚者如彼，而卒莫消长也。盖将自其变者而观之，则天地曾不能以一瞬；自其不变者而观之，则物与我皆无尽也，而又何羡乎！且夫天地之间，物各有主，苟非吾之所有，虽一毫而莫取。惟江上之清风，与山间之明月，耳得之而为声，目遇之而成色，取之无禁，用之不竭，是造物者之无尽藏也，而吾与子之所共适'}}
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item
        name="width"
        rules={[{ required: true, message: '请输入单个汉字宽度' }]}
      >
        <InputNumber addonBefore="单个汉字宽度" min={5} max={A4.w} addonAfter="毫米" placeholder="最大宽度210mm" />
      </Form.Item>

      <Form.Item
        name="height"
        rules={[{ required: true, message: '请输入单个汉字高度' }]}
      >
        <InputNumber addonBefore="单个汉字高度" min={5} max={A4.h} addonAfter="毫米" placeholder="最大高度297mm" />
      </Form.Item>
      <Form.Item
        label="打印的文字"
        name="text"
        rules={[{ required: true, message: '请输入要打印的文字' }]}
      >
        <TextArea showCount={{ formatter: ({count}) => `共${count}个汉字` }} rows={4}  placeholder="点击输入要打印的内容"/>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          预览
        </Button>
      </Form.Item>
    </Form>
      
      </div>
      <div className={styles.kedu}>
      <div className={styles.horizontal}>
        {
          Array.from({length: A4.w/30}).map((item,idx) => <span style={{width: `${30}mm`}} key={idx}><span>{(idx+1)*30}</span></span>)
        }
      </div>
      <div className={styles.vertical}></div>
      <div className={styles.printAreaA4}>
          {
            Array.from({length: pageSize }).map((_p, pageIdx) => <div key={pageIdx} className={styles.a4}>
              <div>
              {
                Array.from({length: rows }).map((_r, rowIdx) => <div key={rowIdx} className={styles.row}>
                    {
                      Array.from({length: columns }).map((_c, colIdx) => <div key={colIdx} className={styles.col} style={{fontSize: `${Math.min(width, height)}mm`, width: `${width}mm`, height: `${height}mm`}}>
                        <span>{text[getTextIndex(pageIdx, rowIdx, colIdx)] || ''}</span>
                        </div>)
                    }
                  </div>)
              }
              </div>
            </div>)
          }
      </div>
      </div>
    </div>
  );
}
