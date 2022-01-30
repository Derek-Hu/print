import {
  TextArea,
  Tag,
  Input,
  ActionSheet,
  Toast,
  Slider,
  Form,
  Button,
} from 'antd-mobile';
import { useEffect, useState } from 'react';
import styles from './index.less';

const A4 = {
  w: 210,
  h: 297,
};

const paddingLeft = 0;
const baseSize = 100;

const marks = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
};

const defaultMark = 3;

const tagColors = [
  'primary',
  'success',
  'warning',
  'danger',
  '#2db7f5',
  '#87d068',
  '#108ee9',
  '#2db7f5',
];

const CacheKey = 'PRINT_SETTINGS';
const SizeKey = 'PRINT_SIZE_SETTINGS';
const AdjustLevelKey = 'PRINT_ADJUST_SETTINGS';
const FontKey = 'PRINT_FONT_SETTINGS';

const firstW = 30;
const firstH = 40;

const defaultTemplate = [
  '25*25',
  '30*30',
  '30*40',
  '40*40',
  '50*40',
  '110*50',
  '120*60',
  '130*70',
];
const MaxTag = 8;

const basicColumns = [
  { text: '隶书', key: 'LiSu' },
  { text: '魏碑体', key: `'Weibei SC','FZWeiBei-S03S'` },
  { text: '楷书', key: `KaiTi, STKaiti, 'FZKai-Z03S', ` },
  { text: '行书', key: `STXingkai, 'Xingkai SC'` },
];

export default function IndexPage() {
  const [form] = Form.useForm();

  const [fontSheetVisible, setFontSheetVisible] = useState(false);
  const [fontFamily, setFontFamily] = useState(basicColumns[0]);
  const [settings, setSettings] = useState({});
  const [selectTag, setSelectTag] = useState('');
  const [textChanged, setTextChanged] = useState(true);
  const [adjustLevel, setAdjustLevel] = useState(defaultMark);
  const [sizeSettings, setSizeSettings] = useState<string[]>([]);

  const onSliderChange = (value: any) => {
    console.log('onSliderChange, ', value);
    const level =
      typeof value === 'number' ? value : Array.isArray(value) ? value[0] : 0;
    setAdjustLevel(level);
    localStorage.setItem(AdjustLevelKey, level);
  };

  const onValuesChange = (values: any) => {
    if ('text' in values) {
      setTextChanged(true);
    }
  };

  const onAction = (action: any) => {
    console.log();
    setFontFamily(action);
    setFontSheetVisible(false);
    localStorage.setItem(FontKey, JSON.stringify(action));
  };
  const calculate = (values: {
    width: number;
    height: number;
    text: string;
  }) => {
    const { width: ww, height: wh, text = '' } = values;
    if (text == null || text === undefined) {
      return;
    }
    const content = String.prototype.trim.call(text);

    if (content === '') {
      return;
    }
    setTextChanged(false);
    if (ww > A4.w || wh > A4.h) {
      Toast.show({
        icon: 'fail',
        content: '单个文字宽度或高度超过A4纸张尺寸',
      });
    }
    setSelectTag(`${ww}*${wh}`);
    const width = Math.min(ww, A4.w);
    const height = Math.min(wh, A4.h);

    console.log('values, ', values);
    const columns = Math.floor(A4.w / width) || 1;
    const rows = Math.floor(A4.h / height) || 1;

    const renderContainerW = window.innerWidth - paddingLeft;

    const a4H = (renderContainerW * A4.h) / A4.w;

    // width / 210 = x / renderContainerW
    const renderW = Math.floor((renderContainerW * width) / A4.w);
    // height/ 297 = y / a4H
    const renderH = Math.floor((a4H * height) / A4.h);

    const pageSize = Math.ceil(content.length / (columns * rows));
    const actualCols = Math.ceil(content.length / rows);

    console.log(`总行数rows = ${A4.h}/${height} = ${rows}`);
    console.log(`总列数columns = ${A4.w}/${width} = ${columns}`);

    console.log(`汉字渲染宽度renderW = ${renderW}`);
    console.log(`汉字渲染高度renderH = ${renderH}`);

    console.log(`A4 渲染尺寸: ${A4.w}*${A4.h} -> ${renderContainerW} * ${a4H}`);

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
      width,
      height,
      // 单个汉字的宽度
      renderW,
      // 单个汉字的高度
      renderH,
      // 实际占用列数
      actualCols,
      printGap: Math.floor((A4.h - rows * height) / 4),
      // printGap: 0,
      // gap: 0,
      gap: Math.floor((a4H - rows * renderH) / 4),
    };
    setSettings(configuration);

    console.log('settings:', configuration);
    console.log('sizeSettings:', sizeSettings);

    localStorage.setItem(CacheKey, JSON.stringify(configuration));

    const template = `${width}*${height}`;
    if (Array.isArray(sizeSettings)) {
      if (sizeSettings.indexOf(template) === -1) {
        sizeSettings.unshift(template);
        if (sizeSettings.length > 8) {
          sizeSettings.pop();
        }
      }
    }
    setSizeSettings([...sizeSettings]);

    console.log('templates', sizeSettings);
    localStorage.setItem(SizeKey, JSON.stringify(sizeSettings));
  };

  const onFinish = (values: {
    width: number;
    height: number;
    text: string;
  }) => {
    console.log('onFinish', values);
    calculate(values);
    setTimeout(() => {
      const settingsArea = document.getElementById('settingsArea');
      if (settingsArea) {
        const h = settingsArea.getBoundingClientRect().height;
        window.scrollTo(0, h);
      }
    }, 0);
  };

  const clickTag = (template: string) => {
    setSelectTag(template);
    const [width, height] = template.split('*');
    form.setFieldsValue({
      width: parseFloat(width),
      height: parseFloat(height),
    });

    calculate({
      ...settings,
      width: parseFloat(width),
      height: parseFloat(height),
    } as any);
  };
  useEffect(() => {
    try {
      const configuration = JSON.parse(
        localStorage.getItem(CacheKey) as string,
      );
      const sizeTemplate = JSON.parse(localStorage.getItem(SizeKey) as string);
      const font = JSON.parse(localStorage.getItem(FontKey) as string);
      const adjustLevel = parseInt(
        localStorage.getItem(AdjustLevelKey) as string,
      );
      console.log('cache: ', configuration);
      setSettings(configuration);
      setFontFamily(font || basicColumns[0]);
      setAdjustLevel(isNaN(adjustLevel) ? defaultMark : adjustLevel);
      let templates = [];
      if (Array.isArray(sizeTemplate) && sizeTemplate.length) {
        templates = sizeTemplate.filter((v) => /\d+\*\d+/.test(v)).slice(0, 8);
      }

      if (!templates.length) {
        templates = defaultTemplate.slice(0, MaxTag);
      }
      console.log('configuration: ', configuration);
      console.log('tag222: ', templates);
      setSizeSettings(templates as any);
      const { width = 0, text = '', height = 0 } = configuration || {};
      form.setFieldsValue({
        text,
      });

      const tag = `${width}*${height}`;
      console.log('tag: ', tag);

      if (templates.indexOf(tag) !== -1) {
        setTimeout(() => {
          clickTag(tag);
        });
      } else {
        setTimeout(() => {
          clickTag(`${firstW}*${firstH}`);
        });
      }
      // calculate(configuration);
    } catch (e) {}
  }, []);

  const {
    columns = 0,
    renderH = 0,
    gap = 0,
    printGap = 0,
    a4H,
    width,
    height,
    renderW = 0,
    actualCols = 0,
    rows = 0,
    pageSize = 0,
    text = '',
  } = (settings || {}) as any;

  const sizePerPage = columns * rows;

  const getTextIndex = (pageIdx: number, row: number, col: number) => {
    return pageIdx * sizePerPage + col * rows + row;
  };

  /**
   * 1: 1 --> 210: 297
   * 2: 1 --> 210: 297 / 2
   */

  const [iw, ih] = selectTag
    ? selectTag.split('*').map((v) => parseFloat(v))
    : [firstW, firstH];
  console.log('sizeSettings', sizeSettings);
  console.log('selectTag', selectTag);

  console.log('iw, ih: ', iw, ih);

  const fontText = fontFamily && fontFamily.key ? fontFamily.key : 'LiSu';
  const fontCNName = fontFamily && fontFamily.text ? fontFamily.text : '隶书';
  return (
    <div className={styles.root}>
      <div className={styles.settings}>
        <div id="settingsArea">
          <h1
            className={styles.title}
            style={{
              fontFamily: fontText,
            }}
          >
            文字打印
          </h1>
          <Form.Item label="字体" onClick={() => setFontSheetVisible(true)}>
            <span className={styles.fontName}>
              {fontFamily && fontFamily.text}
            </span>
          </Form.Item>

          <ActionSheet
            extra="请选择打印的字体"
            onAction={onAction}
            cancelText="取消"
            visible={fontSheetVisible}
            actions={basicColumns}
            onClose={() => setFontSheetVisible(false)}
          />
          {sizeSettings && sizeSettings.length ? (
            <>
              <Form.Item label="常用尺寸">
                <div className={styles.tagList}>
                  {sizeSettings.slice(0, MaxTag).map((template, idx) => {
                    return (
                      <Tag
                        className={
                          selectTag === template ? styles.tagActive : ''
                        }
                        key={idx}
                        onClick={() => clickTag(template)}
                        color={selectTag === template ? 'danger' : 'default'}
                      >
                        {template}
                      </Tag>
                    );
                  })}
                </div>
              </Form.Item>
            </>
          ) : null}

          <Form
            form={form}
            initialValues={{
              width: iw,
              height: ih,
              text: '',
              // text: '故'
            }}
            onValuesChange={onValuesChange}
            onFinish={onFinish}
            footer={
              <div>
                <p style={{ fontSize: '18px', color: '#aaa' }}>
                  纸张尺寸 210mm * 297mm；
                  <br />
                  字体宽{width}mm，一页最多显示{columns}列；
                  <br />
                  字体高{width}mm，一页最多显示{rows}行
                </p>
                <Button block type="submit" color="primary" size="large">
                  预览（
                  <span
                    style={{
                      fontFamily: fontText,
                    }}
                  >
                    {fontFamily && fontFamily.text ? fontFamily.text : '隶书'}
                    字体
                  </span>
                  ）
                </Button>
              </div>
            }
            autoComplete="off"
          >
            {/* <Form.Item name="font" label="字体">
              <Picker columns={basicColumns} />
            </Form.Item> */}

            <Form.Item
              name="width"
              label="单字宽度/宽度 5 ~ 210（毫米）"
              rules={[{ required: true, message: '请输入宽度' }]}
            >
              <Input
                type="number"
                min={5}
                max={A4.w}
                placeholder="最小宽度5mm，最大宽度210mm"
              />
            </Form.Item>

            <Form.Item
              name="height"
              label="单字高度/高度 5 ~ 297（毫米）"
              rules={[{ required: true, message: '请输入高度' }]}
            >
              <Input
                type="number"
                min={5}
                max={A4.h}
                placeholder="最小高度5mm，最大高度297mm"
              />
            </Form.Item>
            <Form.Item
              label="打印的文字"
              name="text"
              rules={[{ required: true, message: '请输入打印文字' }]}
            >
              <TextArea
                showCount={(length) => (
                  <span className={styles.count}>
                    字数统计：共 {length} 个字
                  </span>
                )}
                rows={3}
                placeholder="点击输入要打印的内容"
              />
            </Form.Item>
          </Form>
        </div>

        {textChanged ? null : (
          <>
            {pageSize ? (
              <Form.Item>
                <Button
                  onClick={() => {
                    window.print();
                  }}
                  block
                  color="primary"
                  size="large"
                >
                  打印全部（共{pageSize}页）
                </Button>
              </Form.Item>
            ) : null}

            {pageSize ? (
              <Form.Item label="文字间距微调">
                <Slider
                  value={adjustLevel}
                  onChange={onSliderChange}
                  ticks={true}
                  marks={marks}
                  min={0}
                  max={6}
                />
              </Form.Item>
            ) : null}
          </>
        )}
      </div>

      {textChanged ? null : (
        <div
          className={styles.kedu}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div
            className={styles.privewAreaA4}
            style={{
              fontFamily: fontText,
            }}
          >
            {Array.from({ length: pageSize }).map((_p, pageIdx) => {
              return (
                <div
                  key={pageIdx}
                  className={styles.a4}
                  style={{ height: `${a4H}px` }}
                >
                  <div style={{ paddingTop: `${gap}px` }}>
                    {Array.from({ length: rows }).map((_r, rowIdx) => (
                      <div key={rowIdx} className={styles.row}>
                        {Array.from({ length: columns }).map((_c, colIdx) => {
                          return (
                            <div
                              key={colIdx}
                              className={[
                                styles.col,
                                actualCols > colIdx ? '' : styles.emptyWord,
                              ].join(' ')}
                              style={{
                                // fontSize: `${Math.min(renderW, renderH)}px`,
                                width: `${renderW}px`,
                                height: `${renderH}px`,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: `${baseSize}px`,
                                  transform: `scale(${renderW / baseSize}, ${
                                    renderH / baseSize +
                                    (adjustLevel / 10) *
                                      (renderW / baseSize) *
                                      (height / width)
                                  })`,
                                }}
                              >
                                {text[getTextIndex(pageIdx, rowIdx, colIdx)] ||
                                  ''}
                              </span>
                            </div>
                          );
                        })}
                        <span
                          className={styles.rowIndex}
                          style={{ height: `${renderH}px` }}
                        >
                          {rowIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!textChanged && pageSize > 1 ? (
        <div className={styles.actionFooter}>
          <Form.Item>
            <Button
              onClick={() => {
                window.print();
              }}
              block
              color="primary"
              size="large"
            >
              打印全部（共{pageSize}页）
            </Button>
          </Form.Item>
        </div>
      ) : null}

      <div
        className={styles.printAreaA4}
        style={{
          fontFamily: fontText,
        }}
      >
        {Array.from({ length: pageSize }).map((_p, pageIdx) => {
          return (
            <div
              key={pageIdx}
              style={{
                margin: 0,
                padding: 0,
                border: 0,
                width: `${A4.w}mm`,
                height: `${A4.h}mm`,
                position: 'relative',
              }}
            >
              <p
                style={{
                  fontSize: '10mm',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  textAlign: 'right',
                }}
              >
                &nbsp;&nbsp;页码：{pageIdx + 1}/{pageSize}；<br />
              </p>
              <p
                style={{
                  fontSize: '10mm',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  textAlign: 'right',
                }}
              >
                字间距级别：{adjustLevel}&nbsp;&nbsp;
              </p>
              <p
                style={{
                  fontSize: '10mm',
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  textAlign: 'center',
                }}
              >
                {fontCNName}：宽{width}mm * 高{height}mm；
                <br />
              </p>
              <div style={{ paddingTop: `${printGap}mm` }}>
                {Array.from({ length: rows }).map((_r, rowIdx) => (
                  <div key={rowIdx} className={styles.row}>
                    {Array.from({ length: columns }).map((_c, colIdx) => {
                      return (
                        <div
                          key={colIdx}
                          className={[
                            styles.col,
                            actualCols > colIdx ? '' : styles.emptyWord,
                          ].join(' ')}
                          style={{
                            // fontSize: `${Math.min(width, height)}mm`,
                            width: `${width}mm`,
                            height: `${height}mm`,
                            textAlign: 'center',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: `${width}mm`,
                              transform: `${`scale(1.1, ${
                                height / width +
                                (adjustLevel / 10) * (height / width)
                              })`}`,
                            }}
                          >
                            {text[getTextIndex(pageIdx, rowIdx, colIdx)] || ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
