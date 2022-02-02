import {
  TextArea,
  Tag,
  Input,
  Radio,
  ActionSheet,
  Toast,
  Slider,
  Form,
  Button,
} from 'antd-mobile';
import { useEffect, useState } from 'react';
import styles from './index.less';
import { UndoOutline } from 'antd-mobile-icons';
import md5 from 'blueimp-md5';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/print/sw.js');
}

const answer = '78ac00cf8aa4bce60d7f1113e32afb70';

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

const defaultMark = 1;

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
  { text: '隶书', key: 'LiSu2, LiSu' },
  { text: '魏碑体', key: `WeibeiSC-Bold2, 'Weibei SC'` },
  { text: '楷书', key: `KaiTi2, KaiTi` },
  // { text: '行书', key: `STXingkai, 'Xingkai  SC'` },
];

const getFormattedText = (
  cols: number,
  rows: number,
  direction: 't2d' | 'l2r',
  content: string,
) => {
  const maxLen = direction === 't2d' ? rows : cols;
  if (typeof content === 'string') {
    const chars = content.split(/\n/);
    chars.forEach((item, idx) => {
      const fill = maxLen - (item.length % maxLen);
      if (fill) {
        chars[idx] = `${item}${Array.from({ length: fill })
          .map((v) => ' ')
          .join('')}`;
      }
    });
    return chars.join('');
  }
  return '';
};
const degs = ['270', '180', '90', '0'];
export default function IndexPage() {
  const [form] = Form.useForm();

  const [rowSpaceGap, setRowSpaceGap] = useState(0);
  const [colSpaceGap, setColSpaceGap] = useState(0);

  const [fontSheetVisible, setFontSheetVisible] = useState(false);
  const [fontFamily, setFontFamily] = useState(basicColumns[0]);
  const [settings, setSettings] = useState({});
  const [selectTag, setSelectTag] = useState('');
  const [rotataDeg, setRotateDeg] = useState('0');
  const [textChanged, setTextChanged] = useState(true);
  const [adjustLevel, setAdjustLevel] = useState(defaultMark);
  const [sizeSettings, setSizeSettings] = useState<string[]>([]);

  const nextPosDeg = () => {
    const idx = degs.findIndex((item) => item === rotataDeg);
    console.log('idx: ', idx);
    if (idx + 1 >= degs.length) {
      console.log('next deg: ', degs[0]);
      return degs[0];
    }
    console.log('next deg: ', degs[idx + 1]);
    return degs[idx + 1];
  };

  const nextNegDeg = () => {
    const idx = degs.findIndex((item) => item === rotataDeg);
    if (idx === 0) {
      return degs[degs.length - 1];
    }
    return degs[idx - 1];
  };

  const onSliderChange = (value: any) => {
    console.log('onSliderChange, ', value);
    const level =
      typeof value === 'number' ? value : Array.isArray(value) ? value[0] : 0;
    setAdjustLevel(level);
    localStorage.setItem(AdjustLevelKey, level);
  };

  const onValuesChange = (values: any) => {
    setTextChanged(true);
  };

  const onAction = (action: any) => {
    console.log();
    setFontFamily(action);
    setFontSheetVisible(false);
    localStorage.setItem(FontKey, JSON.stringify(action));
  };
  const calculate = (values: {
    textDirect: 'l2r' | 't2d';
    width: number;
    height: number;
    text: string;
  }) => {
    const { width: ww, textDirect = 'l2r', height: wh, text = '' } = values;
    if (text == null || text === undefined) {
      return;
    }
    const originalText = String.prototype.trim.call(text);

    if (originalText === '') {
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

    console.log('content: ', originalText);
    console.log(`总行数rows = ${A4.h}/${height} = ${rows}`);
    console.log(`总列数columns = ${A4.w}/${width} = ${columns}`);
    console.log(`textDirect = ${textDirect}`);

    const content = getFormattedText(columns, rows, textDirect, originalText);
    console.log('formattedText before', originalText);
    console.log('formattedText after', content);

    const pageSize = Math.ceil(content.length / (columns * rows));
    const actualCols =
      textDirect === 't2d'
        ? Math.ceil(content.length / rows)
        : Math.min(content.length, columns);
    const actualRows =
      textDirect === 't2d'
        ? Math.min(content.length, rows)
        : Math.ceil(content.length / columns);

    console.log(`content.length = ${content.length}`);

    console.log(`actualRows = ${actualRows}`);
    console.log(`actualCols = ${actualCols}`);

    console.log(`汉字渲染宽度renderW = ${renderW}`);
    console.log(`汉字渲染高度renderH = ${renderH}`);

    console.log(`A4 渲染尺寸: ${A4.w}*${A4.h} -> ${renderContainerW} * ${a4H}`);

    const configuration = {
      textDirect,
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
      // 实际占用行数
      actualRows,
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
    textDirect: 'l2r' | 't2d';
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

  const showPwd = () => {
    const password = prompt('请输入密码', '');

    if (password) {
      const repwd = md5(password);
      console.log(repwd, md5(repwd), answer);
      if (md5(repwd) === answer) {
        localStorage.setItem('pwd', repwd);
        return;
      }
    }
    showPwd();
  };
  useEffect(() => {
    const cachePwd = localStorage.getItem('pwd');
    if (cachePwd && md5(cachePwd) === answer) {
      return;
    }
    showPwd();
  }, []);

  const onRowSpaceChange = (value: any) => {
    const level =
      typeof value === 'number' ? value : Array.isArray(value) ? value[0] : 0;
    setRowSpaceGap(level / 10);
  };

  const onColSpaceChange = (value: any) => {
    const level =
      typeof value === 'number' ? value : Array.isArray(value) ? value[0] : 0;
    setColSpaceGap(level / 10);
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
      const {
        width = 0,
        text = '',
        textDirect = 'l2r',
        height = 0,
      } = configuration || {};
      form.setFieldsValue({
        text,
        textDirect,
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
    textDirect,
    actualCols = 0,
    actualRows = 0,
    rows = 0,
    pageSize = 0,
    text = '',
  } = (settings || {}) as any;

  const sizePerPage = columns * rows;

  const getTextIndex = (
    direct: 'l2r' | 't2d',
    pageIdx: number,
    row: number,
    col: number,
  ) => {
    if (direct === 't2d') {
      return pageIdx * sizePerPage + col * rows + row;
    }
    return pageIdx * sizePerPage + row * columns + col;
  };

  const getOffsetStyles = (
    rowIdx: number,
    w: number,
    h: number,
    unit: string,
  ) => {
    const offset = Math.abs(w - h) / 2;

    if (rotataDeg === '90') {
      if (w < h) {
        return { right: `${offset}${unit}` };
      }
    }
    if (rotataDeg === '270') {
      if (w < h) {
        return { left: `${offset}${unit}` };
      }
    }
    return {};
  };
  const getRowStyle = (
    rowIdx: number,
    w: number,
    h: number,
    unit: 'mm' | 'px',
  ) => {
    const offset = Math.abs(w - h) / 2;
    const offsetStyles = getOffsetStyles(rowIdx, w, h, unit);

    const rowGapMargin = rowIdx * rowSpaceGap;
    if (rotataDeg === '0' || rotataDeg === '180') {
      return {
        top: `${rowGapMargin}mm`,
      };
    }
    if (rotataDeg === '90' || rotataDeg === '270') {
      return rowIdx === 0
        ? {
            ...offsetStyles,
            ...(w < h
              ? { top: `${rowGapMargin}mm`, bottom: `${offset}${unit}` }
              : { top: `${offset + rowGapMargin}${unit}` }),
          }
        : w < h
        ? {
            ...offsetStyles,
            top: `${rowGapMargin}mm`,
            bottom: `${rowIdx * (h - w) + offset}${unit}`,
          }
        : {
            ...offsetStyles,
            bottom: `${offset}${unit}`,
            top: `${rowIdx * (w - h) + rowGapMargin + offset}${unit}`,
          };
    }
  };

  const getColStyle = (
    colIdx: number,
    w: number,
    h: number,
    unit: 'mm' | 'px',
  ) => {
    const colGapMargin = colIdx * colSpaceGap;
    return colIdx === 0
      ? {
          left: `${colGapMargin}mm`,
        }
      : rotataDeg === '90' || rotataDeg === '270'
      ? w < h
        ? { left: `${colGapMargin + colIdx * (h - w)}${unit}` }
        : { left: `${colGapMargin}mm`, right: `${colIdx * (w - h)}${unit}` }
      : {
          left: `${colGapMargin}mm`,
        };
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
  const fontWeight = fontCNName === '楷书' ? 'bold' : 'normal';

  const inputW = form.getFieldValue('width');
  const inputH = form.getFieldValue('height');

  console.log('inputW: ', inputW);
  console.log('inputH: ', inputH);

  return (
    <div className={styles.root}>
      <div className={styles.settings}>
        <div id="settingsArea" className={styles.settingsArea}>
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
            }}
            onValuesChange={onValuesChange}
            onFinish={onFinish}
            footer={
              <div>
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
            <Form.Item dependencies={['width', 'height']}>
              {({ getFieldValue }) => {
                console.log('getFieldValue', getFieldValue('width'));
                const inputW = getFieldValue('width');
                const inputH = getFieldValue('height');
                const rSize = Math.floor(A4.w / inputW);
                const cSize = Math.floor(A4.h / inputH);

                const rText = !isNaN(rSize) && isFinite(rSize);
                const cText = !isNaN(cSize) && isFinite(cSize);
                return (
                  <p
                    style={{ marginBottom: 0, fontSize: '16px', color: '#aaa' }}
                  >
                    纸张尺寸 {A4.w}mm * {A4.h}mm
                    {rText ? (
                      <span>
                        <br />
                        字体宽{inputW}mm，一行最多显示{rSize || 1}个字
                      </span>
                    ) : null}
                    {cText ? (
                      <span>
                        <br />
                        字体高{inputH}mm，一页最多显示{cSize || 1}行
                      </span>
                    ) : null}
                  </p>
                );
              }}
            </Form.Item>
            <Form.Item name="textDirect" label="文字排列方向">
              <Radio.Group>
                <Radio value="l2r">从左往右</Radio>
                <Radio value="t2d">从上往下</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label="打印的文字"
              name="text"
              rules={[{ required: true, message: '请输入打印文字' }]}
            >
              <TextArea
                autoSize={true}
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
              <>
                <Form.Item
                  label={
                    <span>
                      文字旋转
                      {rotataDeg === '0' ? (
                        ''
                      ) : (
                        <span style={{ color: 'red' }}>({rotataDeg}度)</span>
                      )}
                    </span>
                  }
                  extra={
                    <Button
                      color="warning"
                      onClick={() => {
                        setRotateDeg('0');
                      }}
                    >
                      &nbsp;不旋转&nbsp;
                    </Button>
                  }
                >
                  <span
                    onClick={() => {
                      setRotateDeg(nextNegDeg());
                    }}
                    style={{
                      fontSize: '18px',
                      display: 'inline-block',
                      marginRight: '20px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <UndoOutline fontSize={23} />
                    </span>
                    逆时针转90度
                  </span>
                </Form.Item>
                <Form.Item
                  label={
                    <span>
                      文字高度微调
                      <span style={{ color: 'red' }}>
                        {adjustLevel ? `(+${adjustLevel})` : ''}
                      </span>
                    </span>
                  }
                  extra={
                    <Button
                      color="warning"
                      onClick={() => {
                        setAdjustLevel(0);
                      }}
                    >
                      &nbsp;不调节&nbsp;
                    </Button>
                  }
                >
                  <Slider
                    value={adjustLevel}
                    onChange={onSliderChange}
                    ticks={true}
                    min={0}
                    max={6}
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <span>
                      上下间距
                      {rowSpaceGap ? (
                        <span style={{ color: 'red' }}>
                          ({rowSpaceGap > 0 ? `+${rowSpaceGap}` : rowSpaceGap}
                          mm)
                        </span>
                      ) : (
                        '(0mm)'
                      )}
                    </span>
                  }
                  extra={
                    <Button
                      color="warning"
                      onClick={() => {
                        setRowSpaceGap(0);
                      }}
                    >
                      设置为0
                    </Button>
                  }
                >
                  <Slider
                    style={{ '--fill-color': '#00b578' }}
                    value={rowSpaceGap * 10}
                    onChange={onRowSpaceChange}
                    min={-Math.min(width, height) * 5}
                    max={Math.max(width, height) * 10}
                  />
                </Form.Item>
                <Form.Item
                  extra={
                    <Button
                      color="warning"
                      onClick={() => {
                        setColSpaceGap(0);
                      }}
                    >
                      设置为0
                    </Button>
                  }
                  label={
                    <span>
                      左右间距
                      {colSpaceGap ? (
                        <span style={{ color: 'red' }}>
                          ({colSpaceGap > 0 ? `+${colSpaceGap}` : colSpaceGap}
                          mm)
                        </span>
                      ) : (
                        '(0mm)'
                      )}
                    </span>
                  }
                >
                  <Slider
                    style={{ '--fill-color': '#ff8f1f' }}
                    value={colSpaceGap * 10}
                    onChange={onColSpaceChange}
                    min={-Math.min(width, height) * 5}
                    max={Math.max(width, height) * 10}
                  />
                </Form.Item>
              </>
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
              fontWeight,
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
                    {Array.from({ length: rows }).map((_r, rowIdx) => {
                      const rowStyle = getRowStyle(
                        rowIdx,
                        renderW,
                        renderH,
                        'px',
                      );
                      return (
                        <div
                          key={rowIdx}
                          style={rowStyle}
                          className={[
                            styles.row,
                            actualRows > rowIdx ? '' : styles.emptyWord,
                          ].join(' ')}
                        >
                          {Array.from({ length: columns }).map((_c, colIdx) => {
                            const colStyle = getColStyle(
                              colIdx,
                              renderW,
                              renderH,
                              'px',
                            );
                            return (
                              <div
                                key={colIdx}
                                className={[
                                  styles.col,
                                  actualCols > colIdx ? '' : styles.emptyWord,
                                ].join(' ')}
                                style={{
                                  ...colStyle,
                                  transform: `rotate(${rotataDeg}deg)`,
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
                                  {text[
                                    getTextIndex(
                                      textDirect,
                                      pageIdx,
                                      rowIdx,
                                      colIdx,
                                    )
                                  ] || ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {!textChanged && pageSize ? (
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
        </div>
      )}

      <div
        className={styles.printAreaA4}
        style={{
          fontFamily: fontText,
          fontWeight,
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
                  fontSize: '5mm',
                  position: 'absolute',
                  fontFamily: '-apple-system, blinkmacsystemfont',
                  top: 0,
                  left: 0,
                  textAlign: 'right',
                }}
              >
                &nbsp;&nbsp;页码：{pageIdx + 1}/{pageSize}；<br />
              </p>
              <p
                style={{
                  fontSize: '5mm',
                  fontFamily: '-apple-system, blinkmacsystemfont',
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  textAlign: 'center',
                }}
              >
                {fontCNName}：宽{width}mm * 高{height}mm；+ 文字高度微调：
                {adjustLevel}(上下间距：{rowSpaceGap}mm，左右间距{colSpaceGap}
                mm)
                <br />
              </p>
              <div style={{ paddingTop: `${printGap}mm` }}>
                {Array.from({ length: rows }).map((_r, rowIdx) => {
                  const rowStyle = getRowStyle(rowIdx, width, height, 'mm');
                  return (
                    <div
                      key={rowIdx}
                      style={rowStyle}
                      className={[
                        styles.row,
                        actualRows > rowIdx ? '' : styles.emptyWord,
                      ].join(' ')}
                    >
                      {Array.from({ length: columns }).map((_c, colIdx) => {
                        const colStyle = getColStyle(
                          colIdx,
                          width,
                          height,
                          'mm',
                        );
                        return (
                          <div
                            key={colIdx}
                            className={[
                              styles.col,
                              actualCols > colIdx ? '' : styles.emptyWord,
                            ].join(' ')}
                            style={{
                              ...colStyle,
                              transform: `rotate(${rotataDeg}deg)`,
                              width: `${width}mm`,
                              height: `${height}mm`,
                              textAlign: 'center',
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: `${width}mm`,
                                transform: `${`scale(1.03, ${
                                  height / width +
                                  (adjustLevel / 10) * (height / width)
                                })`}`,
                              }}
                            >
                              {text[
                                getTextIndex(
                                  textDirect,
                                  pageIdx,
                                  rowIdx,
                                  colIdx,
                                )
                              ] || ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
