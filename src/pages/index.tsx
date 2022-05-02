import {
  TextArea,
  Tag,
  Input,
  Radio,
  ActionSheet,
  Toast,
  Slider,
  Switch,
  Form,
  Modal,
  Button,
} from 'antd-mobile';
import { Typography } from 'antd';
import { useEffect, useState } from 'react';
import styles from './index.less';
import { UndoOutline } from 'antd-mobile-icons';
import {
  PageSizes,
  PageRectColumns,
  FontBasicColumns,
  DefaultTemplate,
  ValidSize,
} from './constant';
import './service';
import queryString from 'query-string';
import QRCode from 'qrcode.react';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/print/sw.js');
}
const { confirm } = Modal;
const paddingLeft = 0;
const baseSize = 100;
const { Paragraph } = Typography;
const defaultMark = 0;

const CacheKey = 'PRINT_SETTINGS';
const SizeKey = 'PRINT_SIZE_SETTINGS';

const RotateKey = 'RotateKey';
const GapVertialKey = 'GapVertialKey';
const GapHorizontalKey = 'GapHorizontalKey';

const AdjustLevelKey = 'PRINT_ADJUST_SETTINGS';
const FontKey = 'PRINT_FONT_SETTINGS';
const PageRectKey = 'PRINT_PAGE_RECT_SETTINGS';
const TextAlignKey = 'PRINT_PAGE_TEXT_ALIGN_SETTINGS';
const WholeAlignKey = 'PRINT_PAGE_WHOLE_ALIGN_SETTINGS';

const firstW = 30;
const firstH = 40;

const MaxTag = 8;
const degs = ['270', '180', '90', '0'];
const basicColumns = FontBasicColumns;

const urlParams = queryString.parse(location.search);
console.log('urlParams: ', urlParams);
if (urlParams) {
  const { f, p, t, w, vj, st, c, td, ww, wh, d, gv, gh } = urlParams;
  localStorage.setItem(FontKey, f as string);
  localStorage.setItem(PageRectKey, (p as string) || '');
  if ('t' in urlParams) {
    localStorage.setItem(TextAlignKey, (t as string) || '');
  }
  if ('w' in urlParams) {
    localStorage.setItem(WholeAlignKey, (w as string) || '');
  }
  if ('vj' in urlParams) {
    const vjVal = Number(urlParams.vj);
    if (!isNaN(vjVal)) {
      localStorage.setItem(AdjustLevelKey, `${vjVal}`);
    }
  }
  if ('st' in urlParams) {
    try {
      const sizeTem = JSON.parse(urlParams.st as string);
      if (Array.isArray(sizeTem)) {
        localStorage.setItem(SizeKey, JSON.stringify(sizeTem));
      }
    } catch (e) {}
  }

  const urlSettings: any = {
    text: '',
    textDirect: 'l2r',
  };

  try {
    const cfg = JSON.parse(localStorage.getItem(CacheKey) as string);
    if (cfg) {
      urlSettings.text = cfg.text;
      urlSettings.textDirect = cfg.textDirect;
    }
  } catch (e) {}

  if (c) {
    urlSettings.text = c;
  }
  if (td) {
    if (td === 'l2r' || td === 't2d') {
      urlSettings.textDirect = td;
    }
  }
  if (ww) {
    const wwVal = Number(ww);
    if (!isNaN(wwVal)) {
      urlSettings.width = wwVal;
    }
  }

  if (wh) {
    const wHVal = Number(wh);
    if (!isNaN(wHVal)) {
      urlSettings.height = wHVal;
    }
  }

  localStorage.setItem(CacheKey, JSON.stringify(urlSettings));

  if (d && degs.indexOf(d as string) !== -1) {
    localStorage.setItem(RotateKey, d as string);
  }

  if (gv) {
    const gvVal = Number(gv as string);
    if (!isNaN(gvVal)) {
      localStorage.setItem(GapVertialKey, `${gvVal}`);
    }
  }

  if (gh) {
    const ghVal = Number(gh as string);
    if (!isNaN(ghVal)) {
      localStorage.setItem(GapHorizontalKey, `${ghVal}`);
    }
  }
}

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
      if (item.length % maxLen) {
        const fill = maxLen - (item.length % maxLen);
        if (fill) {
          chars[idx] = `${item}${Array.from({ length: fill })
            .map((v) => ' ')
            .join('')}`;
        }
      }
    });
    return chars.join('');
  }
  return '';
};

let wChangeTimer: any = null;
let hChangeTimer: any = null;

export default function IndexPage() {
  const [form] = Form.useForm();

  const [rowSpaceGap, setRowSpaceGap] = useState(0);
  const [colSpaceGap, setColSpaceGap] = useState(0);
  const [isTextCenter, setTextCenter] = useState<boolean>(false);
  const [isWholeCenter, setWholeCenter] = useState<boolean>(false);

  const [wChanged, setWChanged] = useState(false);
  const [hChanged, setHChanged] = useState(false);

  const [pageRect, setPageRect] = useState<keyof typeof PageSizes>(
    PageRectColumns[0].key,
  );
  const [pageRectVisible, setPageRectVisible] = useState(false);

  const [fontSheetVisible, setFontSheetVisible] = useState(false);
  const [fontFamily, setFontFamily] = useState(basicColumns[0]);
  const [settings, setSettings] = useState({});
  const [selectTag, setSelectTag] = useState('');
  const [rotataDeg, setRotateDeg] = useState('0');
  const [textChanged, setTextChanged] = useState(true);
  const [adjustLevel, setAdjustLevel] = useState(defaultMark);
  const [sizeSettings, setSizeSettings] = useState<string[]>([]);

  const setRotateSyncCache = (deg: string) => {
    setRotateDeg(deg);
    localStorage.setItem(RotateKey, deg);
  };

  const setRowSpaceGapSyncCache = (val: number) => {
    setRowSpaceGap(val);
    localStorage.setItem(GapVertialKey, `${val}`);
  };

  const setColSpaceGapSyncCache = (val: number) => {
    setColSpaceGap(val);
    localStorage.setItem(GapHorizontalKey, `${val}`);
  };
  const SelectPageRect = PageSizes[pageRect];

  const onQRCode = () => {
    let sizeTemplate = [];
    const cfgSettings = {
      c: '',
      td: '',
      ww: '',
      wh: '',
    };
    try {
      const cfg = JSON.parse(localStorage.getItem(CacheKey) as string);
      if (cfg) {
        cfgSettings.c = cfg.text;
        cfgSettings.td = cfg.textDirect;
        cfgSettings.ww = cfg.width;
        cfgSettings.wh = cfg.height;
      }
      sizeTemplate = JSON.parse(localStorage.getItem(SizeKey) as string);
    } catch (e) {}

    const paramsObj: any = {
      f: encodeURIComponent((localStorage.getItem(FontKey) as string) || ''),
      p: localStorage.getItem(PageRectKey),
      t: localStorage.getItem(TextAlignKey),
      w: localStorage.getItem(WholeAlignKey),
      vj: localStorage.getItem(AdjustLevelKey),
      st: encodeURIComponent(JSON.stringify(sizeTemplate)),
      c: encodeURIComponent(cfgSettings.c),
      td: cfgSettings.td,
      ww: cfgSettings.ww,
      wh: cfgSettings.wh,
      d: localStorage.getItem(RotateKey),
      gv: localStorage.getItem(GapVertialKey),
      gh: localStorage.getItem(GapHorizontalKey),
    };
    const links =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      '?';

    const params = Object.keys(paramsObj)
      .map((key) => `${key}=${paramsObj[key]}`)
      .join('&');

    console.log('links + params: ', links + params);
    confirm({
      title: '二维码',

      content: (
        <Paragraph
          copyable={{
            text: links + params,
          }}
        >
          点击复制链接
        </Paragraph>
      ),
      cancelText: '我知道了',
    });
  };

  const nextNegDeg = () => {
    const idx = degs.findIndex((item) => item === rotataDeg);
    if (idx === 0) {
      return degs[degs.length - 1];
    }
    return degs[idx - 1];
  };

  const onSliderChange = (value: any) => {
    const level =
      typeof value === 'number' ? value : Array.isArray(value) ? value[0] : 0;
    setAdjustLevel(level);
    localStorage.setItem(AdjustLevelKey, level);
  };

  const onValuesChange = (values: any) => {
    if ('width' in values) {
      if (wChangeTimer) {
        clearTimeout(wChangeTimer);
      }
      setWChanged(true);
      wChangeTimer = setTimeout(() => {
        setWChanged(false);
      }, 3000);
    }
    if ('height' in values) {
      if (hChangeTimer) {
        clearTimeout(hChangeTimer);
      }
      setHChanged(true);
      hChangeTimer = setTimeout(() => {
        setHChanged(false);
      }, 3000);
    }
    setTextChanged(true);
  };

  const onAction = (action: any) => {
    setFontFamily(action);
    setFontSheetVisible(false);
    localStorage.setItem(FontKey, action.key);
  };

  const onPageAction = (action: any) => {
    setPageRect(action.key);
    setPageRectVisible(false);
    setTextChanged(true);
    localStorage.setItem(PageRectKey, action.key);
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
    if (ww > SelectPageRect.w || wh > SelectPageRect.h) {
      Toast.show({
        icon: 'fail',
        content: `单个文字宽度或高度超过${pageRect}纸张尺寸`,
      });
    }
    setSelectTag(`${ww}*${wh}`);
    const width = Math.min(ww, SelectPageRect.w);
    const height = Math.min(wh, SelectPageRect.h);

    const columns = Math.floor(SelectPageRect.w / width) || 1;
    const rows = Math.floor(SelectPageRect.h / height) || 1;

    const renderContainerW = window.innerWidth;

    const a4H = (window.innerWidth * SelectPageRect.h) / SelectPageRect.w;

    // width / 210 = x / renderContainerW
    const renderW = Math.floor((window.innerWidth * width) / SelectPageRect.w);
    // height/ 297 = y / a4H
    const renderH = Math.floor((a4H * height) / SelectPageRect.h);

    console.log('content: ', originalText);
    console.log(`总行数rows = ${SelectPageRect.h}/${height} = ${rows}`);
    console.log(`总列数columns = ${SelectPageRect.w}/${width} = ${columns}`);
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

    console.log(
      `${PageRectColumns} 渲染尺寸: ${SelectPageRect.w}*${SelectPageRect.h} -> ${renderContainerW} * ${a4H}`,
    );

    let maxEmptyCol = 1;
    const emptyColInfo: any = {};
    for (let jdx = pageSize - 1; jdx >= 0; jdx--) {
      for (let rdx = actualRows - 1; rdx >= 0; rdx--) {
        for (let idx = actualCols - 1; idx >= 0; idx--) {
          const word = text[getTextIndex(textDirect, jdx, rdx, idx)] || '';
          if (
            word !== ' ' &&
            word !== null &&
            word != undefined &&
            word !== ''
          ) {
            if (!emptyColInfo[jdx]) {
              emptyColInfo[jdx] = {};
            }
            if (
              emptyColInfo[jdx][rdx] === undefined ||
              emptyColInfo[jdx][rdx] === null
            ) {
              emptyColInfo[jdx][rdx] = idx + 1;
              if (idx + 1 > maxEmptyCol) {
                maxEmptyCol = idx + 1;
              }
            }
          }
        }
      }
    }
    const configuration = {
      emptyColInfo,
      maxEmptyCol,
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
      printGap: Math.floor((SelectPageRect.h - rows * height) / 2),
      // printGap: 0,
      // gap: 0,
      gap: Math.floor((a4H - rows * renderH) / 2),
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

  const onRowSpaceChange = (value: any) => {
    const level =
      typeof value === 'number' ? value : Array.isArray(value) ? value[0] : 0;
    setRowSpaceGapSyncCache(level / 10);
  };

  const onColSpaceChange = (value: any) => {
    const level =
      typeof value === 'number' ? value : Array.isArray(value) ? value[0] : 0;
    setColSpaceGapSyncCache(level / 10);
  };

  useEffect(() => {
    try {
      const configuration = JSON.parse(
        localStorage.getItem(CacheKey) as string,
      );
      const deg = localStorage.getItem(RotateKey);
      if (degs.indexOf(deg as string) !== -1) {
        setRotateDeg(deg as string);
      }

      const vertialGap = localStorage.getItem(GapVertialKey);
      const horizontalGap = localStorage.getItem(GapHorizontalKey);
      if (vertialGap) {
        const vGap = Number(vertialGap);
        if (!isNaN(vGap)) {
          setRowSpaceGap(vGap);
        }
      }

      if (horizontalGap) {
        const hGap = Number(horizontalGap);
        if (!isNaN(hGap)) {
          setColSpaceGap(hGap);
        }
      }

      const sizeTemplate = JSON.parse(localStorage.getItem(SizeKey) as string);
      const font = localStorage.getItem(FontKey) as string;
      const pageRectCache: any = localStorage.getItem(PageRectKey) as string;
      const adjustLevel = parseInt(
        localStorage.getItem(AdjustLevelKey) as string,
      );
      console.log('cache: ', configuration);
      console.log('cache: adjustLevel', adjustLevel);
      const isTextCenterCache = !!localStorage.getItem(TextAlignKey);
      setTextCenter(isTextCenterCache);
      if (isTextCenterCache) {
        setWholeCenter(true);
        localStorage.setItem(WholeAlignKey, '1');
      } else {
        setWholeCenter(!!localStorage.getItem(WholeAlignKey));
      }
      setSettings(configuration);
      const currPageRect = ValidSize.indexOf(pageRectCache) !== -1;
      setPageRect(currPageRect ? pageRectCache : PageRectColumns[0].key);
      const currFont = FontBasicColumns.find(({ key }) => key === font);
      setFontFamily(currFont || basicColumns[0]);
      setAdjustLevel(isNaN(adjustLevel) ? defaultMark : adjustLevel);
      let templates = [];
      if (Array.isArray(sizeTemplate) && sizeTemplate.length) {
        templates = sizeTemplate.filter((v) => /\d+\*\d+/.test(v)).slice(0, 8);
      }

      if (!templates.length) {
        templates = DefaultTemplate.slice(0, MaxTag);
      }
      console.log('configuration: ', configuration);
      console.log('tag222: ', templates);
      setSizeSettings(templates as any);
      const { width = firstW, text = '', textDirect = 'l2r', height = firstH } =
        configuration || {};
      form.setFieldsValue({
        text,
        textDirect,
        width,
        height,
      });

      const tag = `${width}*${height}`;

      console.log(
        'templates.indexOf(tag) !== -1',
        templates,
        tag,
        templates.indexOf(tag) !== -1,
      );
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
    emptyColInfo = {},
    maxEmptyCol = 1,
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
  const withUnit = (
    val: number,
    direction: 'left' | 'right' | 'top' | 'bottom',
    unit: 'mm' | 'px',
  ) => {
    if (unit === 'mm') {
      return `${val}${unit}`;
    }
    if (direction === 'left' || direction === 'right') {
      // offsetW/val = innerWidth / SelectPageRect.w
      const offsetW = Math.floor((window.innerWidth * val) / SelectPageRect.w);
      return `${offsetW}${unit}`;
    }
    if (direction === 'top' || direction === 'bottom') {
      const a4H = (window.innerWidth * SelectPageRect.h) / SelectPageRect.w;
      // offsetH/val = a4H / SelectPageRect.h
      const offsetH = Math.floor((a4H * val) / SelectPageRect.h);
      return `${offsetH}${unit}`;
    }
  };
  const getOffsetStyles = (w: number, h: number, unit: 'mm' | 'px') => {
    const offset = Math.abs(w - h) / 2;

    if (rotataDeg === '90') {
      if (w < h) {
        return { right: `${withUnit(offset, 'right', unit)}` };
      }
    }
    if (rotataDeg === '270') {
      if (w < h) {
        return { left: `${withUnit(offset, 'left', unit)}` };
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
    const offsetStyles = getOffsetStyles(w, h, unit);

    const rowGapMargin = rowIdx * rowSpaceGap;
    if (rotataDeg === '0' || rotataDeg === '180') {
      return {
        top: `${withUnit(rowGapMargin, 'top', unit)}`,
      };
    }
    if (rotataDeg === '90' || rotataDeg === '270') {
      return rowIdx === 0
        ? {
            ...offsetStyles,
            ...(w < h
              ? {
                  top: `${withUnit(rowGapMargin, 'top', unit)}`,
                  bottom: `${withUnit(offset, 'bottom', unit)}`,
                }
              : { top: `${withUnit(offset + rowGapMargin, 'top', unit)}` }),
          }
        : w < h
        ? {
            ...offsetStyles,
            top: `${withUnit(rowGapMargin, 'top', unit)}`,
            bottom: `${withUnit(rowIdx * (h - w) + offset, 'bottom', unit)}`,
          }
        : {
            ...offsetStyles,
            bottom: `${withUnit(offset, 'bottom', unit)}`,
            top: `${withUnit(
              rowIdx * (w - h) + rowGapMargin + offset,
              'top',
              unit,
            )}`,
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
          left: `${withUnit(colGapMargin, 'left', unit)}`,
        }
      : rotataDeg === '90' || rotataDeg === '270'
      ? w < h
        ? { left: `${withUnit(colGapMargin + colIdx * (h - w), 'left', unit)}` }
        : {
            left: `${withUnit(colGapMargin, 'left', unit)}`,
            right: `${withUnit(colIdx * (w - h), 'right', unit)}`,
          }
      : {
          left: `${withUnit(colGapMargin, 'left', unit)}`,
        };
  };

  /**
   * 1: 1 --> 210: 297
   * 2: 1 --> 210: 297 / 2
   */

  const [iw, ih] = selectTag
    ? selectTag.split('*').map((v) => parseFloat(v))
    : [firstW, firstH];
  // console.log('sizeSettings', sizeSettings);
  // console.log('selectTag', selectTag);

  // console.log('iw, ih: ', iw, ih);

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
            onClick={onQRCode}
          >
            文字打印-点击生成二维码
          </h1>
          <Form.Item label="字体" onClick={() => setFontSheetVisible(true)}>
            <span className={styles.fontName}>
              {fontFamily && fontFamily.text}
            </span>
          </Form.Item>

          <Form.Item label="纸张尺寸" onClick={() => setPageRectVisible(true)}>
            <span className={styles.fontName}>{pageRect}</span>
          </Form.Item>

          <ActionSheet
            extra="请选择纸张尺寸"
            onAction={onPageAction}
            cancelText="取消"
            visible={pageRectVisible}
            actions={PageRectColumns}
            onClose={() => setPageRectVisible(false)}
          />

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
              label={`单字宽度/宽度 5 ~ ${SelectPageRect.w}（毫米）`}
              rules={[{ required: true, message: '请输入宽度' }]}
            >
              <Input
                type="number"
                min={5}
                max={SelectPageRect.w}
                placeholder={`最小宽度5mm，最大宽度${SelectPageRect.w}mm`}
              />
            </Form.Item>

            <Form.Item
              name="height"
              label={`单字高度/高度 5 ~ ${SelectPageRect.h}（毫米）`}
              rules={[{ required: true, message: '请输入高度' }]}
            >
              <Input
                type="number"
                min={5}
                max={SelectPageRect.h}
                placeholder={`最小高度5mm，最大高度${SelectPageRect.h}mm`}
              />
            </Form.Item>
            <Form.Item dependencies={['width', 'height']}>
              {({ getFieldValue }) => {
                console.log('getFieldValue', getFieldValue('width'));
                const inputW = getFieldValue('width');
                const inputH = getFieldValue('height');
                const rSize = Math.floor(SelectPageRect.w / inputW);
                const cSize = Math.floor(SelectPageRect.h / inputH);

                const rText = !isNaN(rSize) && isFinite(rSize);
                const cText = !isNaN(cSize) && isFinite(cSize);
                return (
                  <p
                    className={styles.description}
                    style={{ marginBottom: 0, fontSize: '16px', color: '#aaa' }}
                  >
                    {rText ? (
                      <span className={wChanged ? styles.wChanged : ''}>
                        字体宽{inputW}mm，一行最多显示{rSize || 1}个字
                        <br />
                      </span>
                    ) : null}
                    {cText ? (
                      <span className={hChanged ? styles.hChanged : ''}>
                        字体高{inputH}mm，一页最多显示{cSize || 1}行<br />
                      </span>
                    ) : null}
                    <span>
                      纸张尺寸 {SelectPageRect.w}mm * {SelectPageRect.h}mm
                    </span>
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
              <div className={styles.adjustArea}>
                <Form.Item
                  style={{ paddingTop: '6px', paddingBottom: '6px' }}
                  label={<span>水平排列</span>}
                >
                  <span style={{ fontSize: '15px' }}>文字居中：</span>
                  <Switch
                    onChange={() => {
                      setTextCenter(!isTextCenter);
                      if (!isTextCenter) {
                        setWholeCenter(true);
                        localStorage.setItem(WholeAlignKey, '1');
                      }
                      localStorage.setItem(
                        TextAlignKey,
                        !isTextCenter ? '1' : '',
                      );
                    }}
                    checked={isTextCenter}
                  />
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: '20px',
                      fontSize: '15px',
                    }}
                  >
                    整体居中：
                  </span>
                  <Switch
                    onChange={() => {
                      setWholeCenter(!isWholeCenter);
                      localStorage.setItem(
                        WholeAlignKey,
                        !isWholeCenter ? '1' : '',
                      );
                    }}
                    checked={isWholeCenter}
                  />
                </Form.Item>
                <Form.Item
                  style={{ paddingTop: '6px', paddingBottom: '6px' }}
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
                        setRotateSyncCache('0');
                      }}
                    >
                      &nbsp;不旋转&nbsp;
                    </Button>
                  }
                >
                  <span
                    onClick={() => {
                      setRotateSyncCache(nextNegDeg());
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
                      单个文字高度微调
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
                        localStorage.setItem(AdjustLevelKey, '0');
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
                        setRowSpaceGapSyncCache(0);
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
                        setColSpaceGapSyncCache(0);
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
              </div>
            ) : null}
          </>
        )}
      </div>

      {textChanged ? null : (
        <div
          className={[
            styles.printAreaA4,
            isTextCenter ? styles.printTextAlignCenter : '',
            isWholeCenter ? styles.printWholeCenter : '',
          ].join(' ')}
          style={{
            fontFamily: fontText,
            fontWeight,
            width: `${SelectPageRect.w}mm`,
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
                  width: `${SelectPageRect.w}mm`,
                  height: `${SelectPageRect.h}mm`,
                  position: 'relative',
                }}
              >
                <p
                  style={{
                    fontSize: '4mm',
                    fontFamily: '-apple-system, blinkmacsystemfont',
                    position: 'absolute',
                    bottom: '8mm',
                    lineHeight: '1',
                    padding: 0,
                    margin: 0,
                    right: 0,
                    textAlign: 'center',
                  }}
                >
                  页码:{pageIdx + 1}/{pageSize}；{fontCNName}:宽{width}mm*高
                  {height}mm;单个文字高度微调:
                  {adjustLevel}(上下间距:{rowSpaceGap}mm/左右间距{colSpaceGap}
                  mm)
                  <br />
                </p>
                <div style={{ padding: `${printGap}mm 0` }}>
                  {Array.from({ length: rows }).map((_r, rowIdx) => {
                    const rowStyle = getRowStyle(
                      pageIdx * rows + rowIdx,
                      width,
                      height,
                      'mm',
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
                            width,
                            height,
                            'mm',
                          );

                          let isEmptyCol = false;
                          if (isTextCenter) {
                            const rowEmptyCol =
                              emptyColInfo[pageIdx] &&
                              emptyColInfo[pageIdx][rowIdx];
                            isEmptyCol = colIdx >= rowEmptyCol;
                          }

                          return (
                            <div
                              key={colIdx}
                              className={[
                                styles.col,
                                colIdx >= maxEmptyCol ? styles.emptyWord : '',
                                isEmptyCol ? styles.rowEmptyWord : '',
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
                                  transform: `${`scale(1, ${
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
      )}
      {textChanged ? null : (
        <div
          className={styles.kedu}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div
            className={[
              styles.privewAreaA4,
              isTextCenter ? styles.printTextAlignCenter : '',
              isWholeCenter ? styles.printWholeCenter : '',
            ].join(' ')}
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
                  <div style={{ padding: `${gap}px 0` }}>
                    {Array.from({ length: rows }).map((_r, rowIdx) => {
                      const rowStyle = getRowStyle(
                        pageIdx * rows + rowIdx,
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

                            let isEmptyCol = false;
                            if (isTextCenter) {
                              const rowEmptyCol =
                                emptyColInfo[pageIdx] &&
                                emptyColInfo[pageIdx][rowIdx];
                              isEmptyCol = colIdx >= rowEmptyCol;
                            }

                            return (
                              <div
                                key={colIdx}
                                className={[
                                  styles.col,
                                  colIdx >= maxEmptyCol ? styles.emptyWord : '',
                                  isEmptyCol ? styles.rowEmptyWord : '',
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
        </div>
      )}

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
  );
}
