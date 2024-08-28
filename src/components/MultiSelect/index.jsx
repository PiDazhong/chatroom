/**
 * @des 多选带搜索的选择器
 * @des-url https://www.quantanalysis.cn/icons/components/MultiSelect.png
 */
import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import PinyinEngine from 'pinyin-engine';
import { Select, Input, Button, Dropdown, Checkbox } from 'antd';
import { VariableSizeList as VirtualList } from 'react-window';
import Abbr from 'components/Abbr';
import classNames from 'classnames';
import _ from 'lodash';
import './MultiSelect.scss';

const { Option } = Select;

const MultiSelect = ({
  selectedBefore = true,
  className = '',
  popupClassName = '',
  options: optionInProps,
  value,
  onChange,
  isVirtual,
  renderLengthLimit,
  ...wraps
}) => {
  const [searchText, setSearchText] = useState('');

  const [allSelected, setAllSelected] = useState(false);

  const [open, setOpen] = useState(false);

  const [selectInnerValue, setSelectInnerValue] = useState([]);

  useEffect(() => {
    setSelectInnerValue(value || []);
  }, [value]);

  useEffect(() => {
    setSearchText('');
  }, [open]);

  const options = useMemo(() => {
    return selectedBefore
      ? optionInProps
          .map((t) => ({ ...t, selected: value?.includes(t.value) ? 1 : 0 }))
          .sort((a, b) => b.selected - a.selected)
      : optionInProps;
  }, [selectedBefore, optionInProps, value]);

  // 过滤
  const getFilteredOptions = useMemo(() => {
    const results = _.filter(options, (t) => {
      let filterKey;
      if (_.isString(t.label)) {
        filterKey = 'label';
      } else {
        filterKey = 'filterLabel';
      }

      const searchTextFilter = searchText
        ? t[filterKey]?.includes(searchText)
        : true;
      const engine = new PinyinEngine([t], [filterKey]);
      const pinyin = engine?.query(searchText?.toLowerCase());
      const pinyinFilter = pinyin?.length > 0;
      return searchTextFilter || pinyinFilter;
    });
    if (renderLengthLimit && renderLengthLimit >= 0) {
      return results.slice(0, renderLengthLimit);
    }
    return results;
  }, [options, searchText, renderLengthLimit]);

  // 是否是全选
  const isAllChecked = useMemo(() => {
    return getFilteredOptions.every((t) => selectInnerValue?.includes(t.value));
  }, [getFilteredOptions, selectInnerValue]);

  // 是否半选
  const isHalfChecked = useMemo(() => {
    return selectInnerValue?.length > 0 && !isAllChecked;
  }, [selectInnerValue, isAllChecked]);

  const handleOnChange = useCallback(
    (val) => {
      if (!_.isNil(val)) {
        onChange(val);
      } else {
        onChange([]);
      }
    },
    [onChange],
  );

  // 选中一个
  const handleClickOption = useCallback((checked, val) => {
    if (checked) {
      setSelectInnerValue((prev) => [...prev, val]);
    } else {
      setSelectInnerValue((prev) => _.filter(prev, (t) => t !== val));
    }
  }, []);

  // 全选
  const handleClickSelectAll = useCallback(
    (checked) => {
      const nowOptions = getFilteredOptions.map(({ value }) => value);
      if (checked) {
        setSelectInnerValue((prev) => _.uniq([...nowOptions, ...prev]));
        setAllSelected(true);
      } else {
        setSelectInnerValue((prev) =>
          _.filter(prev, (t) => !nowOptions.includes(t)),
        );
        setAllSelected(false);
      }
    },
    [getFilteredOptions],
  );

  // 点击确定
  const handleOk = () => {
    handleOnChange(selectInnerValue);
    setOpen(false);
  };

  // 单个项目渲染组件
  // eslint-disable-next-line react/display-name
  const ItemRenderer = memo(({ index, style, data }) => {
    const { label, value, des } = data[index];
    return (
      <div
        key={value}
        className={classNames('option-item', {
          'option-item-active': selectInnerValue?.includes(value),
        })}
        style={{ ...style, height: '22px' }}
      >
        <Checkbox
          checked={selectInnerValue?.includes(value)}
          onChange={(e) => handleClickOption(e.target.checked, value)}
        >
          <div className="abbr-option-item">
            <Abbr className="abbr-option-item-label" key={value} text={label} />
            {des && <span className="abbr-option-item-des">{des}</span>}
          </div>
        </Checkbox>
      </div>
    );
  });

  return (
    <Select
      {...wraps}
      mode="multiple"
      value={value}
      onChange={handleOnChange}
      className={classNames('mutli-select-element', className)}
      open={open}
      showSearch={false}
      onDropdownVisibleChange={setOpen}
      popupClassName={classNames(
        'mutli-select-element-dropdown',
        popupClassName,
      )}
      onKeyDown={(e) => e.stopPropagation()}
      dropdownRender={(menu) => (
        <div className="dropdown-content">
          <Input
            className="search-input"
            placeholder="请输入搜索文本"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="option-container">
            {isVirtual ? (
              <VirtualList
                width={'100%'}
                height={300}
                itemCount={getFilteredOptions.length}
                itemSize={() => 30}
                overscanCount={10}
                itemData={getFilteredOptions}
              >
                {({ index, style, data }) => (
                  <ItemRenderer
                    index={index}
                    style={style}
                    data={data}
                    selectInnerValue={selectInnerValue}
                    handleClickOption={handleClickOption}
                  />
                )}
              </VirtualList>
            ) : (
              getFilteredOptions.map(({ label, value, des }) => (
                <div
                  key={value}
                  className={classNames('option-item', {
                    'option-item-active': selectInnerValue?.includes(value),
                  })}
                >
                  <Checkbox
                    checked={selectInnerValue?.includes(value)}
                    onChange={(e) => handleClickOption(e.target.checked, value)}
                  >
                    {_.isString(label) ? (
                      <div className="abbr-option-item">
                        <Abbr
                          className="abbr-option-item-label"
                          key={value}
                          text={label}
                        />
                        {des && (
                          <Abbr className="abbr-option-item-des" text={des} />
                        )}
                      </div>
                    ) : (
                      <div className="abbr-option-item">{label}</div>
                    )}
                  </Checkbox>
                </div>
              ))
            )}
          </div>
          <div className="footer">
            <Checkbox
              indeterminate={isHalfChecked}
              checked={isAllChecked}
              onChange={(e) => handleClickSelectAll(e.target.checked)}
            >
              全选
            </Checkbox>
            <Button type="primary" onClick={handleOk}>
              确定
            </Button>
          </div>
        </div>
      )}
    >
      {getFilteredOptions.map(({ label, value }) => (
        <Option key={value} value={value} style={{ display: 'none' }}>
          {label}
        </Option>
      ))}
    </Select>
  );
};

export default MultiSelect;
