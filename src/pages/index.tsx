import { TextArea, Input, Form, Button } from 'antd-mobile';
import { useEffect, useState } from 'react';
import styles from './index.less';

const A4 = {
  w: 210,
  h: 297
}

const paddingLeft = 20;

const CacheKey = 'PRINT_SETTINGS';

export default function IndexPage() {
  
  const [settings, setSettings] = useState({});

  const onFinish = (values: { width: number, height: number, text: string; }) => {
    console.log('Success:', values);
    const { width, height, text } = values;

    const columns = Math.floor(A4.w / width);
    const rows = Math.floor(A4.h / height);

    const renderContainerW = window.innerWidth - paddingLeft;

    const a4H = renderContainerW * A4.h/A4.w;

    // width / 210 = x / renderContainerW 
    const renderW = Math.floor(renderContainerW * width/A4.w);
    // height/ 297 = y / a4H
    const renderH = Math.floor(a4H * height/A4.h);

    const content = String.prototype.trim.call(text);
    const pageSize = Math.ceil(content.length / (columns * rows));
    const actualCols = Math.ceil(content.length / rows);

    console.log(`总行数rows = ${A4.h}/${height} = ${rows}`);
    console.log(`总列数columns = ${A4.w}/${width} = ${columns}`);

    console.log(`汉字渲染宽度renderW = ${renderW}`);
    console.log(`汉字渲染高度renderH = ${renderH}`);

    console.log(`A4 渲染尺寸: ${A4.w}*${A4.h} -> ${renderContainerW} * ${a4H}`)

    const configuration = {
      a4H,
      // 总行数
      rows,
      // 总列数
      columns,
      // 总页数
      pageSize,
      // 打印的文字
      text: content,
      // 单个汉字的宽度
      width: renderW,
      // 单个汉字的高度
      height: renderH,
      // 实际占用列数
      actualCols,
      gap: Math.floor((a4H - (rows * renderH)) / 2)
    };
    setSettings(configuration);

    console.log('settings:', configuration);

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
  

  const { columns = 0, height=0, gap=0, a4H, width=0, actualCols=0, rows = 0, pageSize=0, text='' } = (settings || {}) as any;

  const sizePerPage = columns * rows;

  const getTextIndex = (pageIdx: number, row: number, col: number) => {
    return pageIdx*sizePerPage + col * rows + row;
  }
  return (
    <div className={styles.root}>
      <div className={styles.settings}>
      <h1 className={styles.title}>文字打印 隶书</h1>
      <Form
      initialValues={{width: 30, height: 40, text: '故人西辞黄鹤楼夜来风雨声花落知多少满纸荒唐言一把辛酸泪都云作者痴谁解其中味客亦知夫水与月乎？逝者如斯，而未尝往也；盈虚者如彼，而卒莫消长也。盖将自其变者而观之，则天地曾不能以一瞬；自其不变者而观之，则物与我皆无尽也，而又何羡乎！且夫天地之间，物各有主，苟非吾之所有，虽一毫而莫取。惟江上之清风，与山间之明月，耳得之而为声，目遇之而成色，取之无禁，用之不竭，是造物者之无尽藏也，而吾与子之所共适'}}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      footer={
        <Button block type='submit' color='primary' size='large'>
          提交
        </Button>
      }
      autoComplete="off"
    >
      <Form.Item
        name="width"
        label='汉字宽度（毫米）'
        rules={[{ required: true, message: '请输入单个汉字宽度' }]}
      >
        <Input min={5} max={A4.w} placeholder="最大宽度210mm" />
      </Form.Item>

      <Form.Item
        name="height"
        label='单个汉字高度（毫米）'
        rules={[{ required: true, message: '请输入单个汉字高度' }]}
      >
        <Input  min={5} max={A4.h} placeholder="最大高度297mm" />
      </Form.Item>
      <Form.Item
        label="打印的文字"
        name="text"
        rules={[{ required: true, message: '请输入要打印的文字' }]}
      >
        <TextArea rows={4}  placeholder="点击输入要打印的内容"/>
      </Form.Item>
    </Form>
      
      </div>
      <div className={styles.kedu} style={{paddingLeft: `${paddingLeft}px`}}>
      <div className={styles.printAreaA4}>
          {
            Array.from({length: pageSize }).map((_p, pageIdx) => <div key={pageIdx} className={styles.a4} style={{ height: `${a4H}px`}}>
              <div style={{ paddingTop: `${gap}px`, }}>
              {
                Array.from({length: rows }).map((_r, rowIdx) => <div key={rowIdx} className={styles.row}>
                    {
                      Array.from({length: columns }).map((_c, colIdx) => {
                        return <div key={colIdx} className={[styles.col, actualCols > colIdx ? '' : styles.emptyWord].join(' ')} style={{fontSize: `${Math.min(width, height)}px`, width: `${width}px`, height: `${height}px`}}>
                        <span >{text[getTextIndex(pageIdx, rowIdx, colIdx)] || ''}</span>
                        </div>;
                      })
                    }
                    <span className={styles.rowIndex} style={{height: `${height}px`}}>{rowIdx+1}</span>
                  </div>)
              }
              {/* <div style={{height: `${gap}px`}}></div> */}
              </div>
            </div>)
          }
      </div>
      </div>
    </div>
  );
}
