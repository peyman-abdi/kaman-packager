import React, { Component } from 'react';
import { AppBar, List, ListItem, SelectField, Avatar, Table, TableHeader, TableRow, TableHeaderColumn, TableRowColumn, TableBody, Toolbar, DropDownMenu, Toggle, ToolbarTitle, ToolbarGroup, ToolbarSeparator, IconMenu, IconButton, Subheader, Chip, Popover, FontIcon, Menu, CircularProgress, MenuItem, RaisedButton, Checkbox, Paper, Card, FlatButton, CardHeader, CardText, CardActions } from 'material-ui';
import {
  Step,
  Stepper,
  StepLabel,
} from 'material-ui/Stepper';
import { AvVideoLibrary, AvLibraryBooks, ActionSpellcheck } from 'material-ui/svg-icons'
import { Spinner } from 'belle'


const each = require('foreach');

import RestKit from './../api/RestKit';
import KamanPacker from './../utils/KamanPacker';
import { EventDispatcher, EventIDs } from './../utils/EventDispatcher';
import {} from './HomePage.css';

const ChipWrapper = {
  chip: {
    width: '120px',
    margin: 4,
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  },
};
const Styles = {
  SelectFieldWidth: {
    width: 150,
  },
};
const BooksHorizontalStyle = {
  padding: 0,
  overflow: 'scroll',
  width: '100%',
  height: '600px',
};

var PackableMetaData = {};
class BookSmallListItem extends Component {
  constructor(props) {
    super(props);
    this.handleTouchTap = this.handleTouchTap.bind(this);
    this.handleRequestClose = this.handleRequestClose.bind(this);
    this.handleQualitySelect = this.handleQualitySelect.bind(this);
    this.handleMetaDataReceived = this.handleMetaDataReceived.bind(this);
    this.handlePackageMetaData = this.handlePackageMetaData.bind(this);
    this.handleDefaultQualityChange = this.handleDefaultQualityChange.bind(this);
    this.handleToggleItem = this.handleToggleItem.bind(this);
    this.handleReceivedBookData = this.handleReceivedBookData.bind(this);

    this.state = {book: null, quality: null};
    this.handleReceivedBookData(this.props.book, this.props.quality, this.props.default_packable);
  }
  componentWillReceiveProps(props) {
    let still_same = props.book.id == this.state.book.id;
    this.handleReceivedBookData(props.book, props.quality, props.default_packable || (this.state.packable && still_same));
    this.setState(this.state);
  }

  handleReceivedBookData(book, quality, packable) {
    this.state.open = false;

    var isDirty = false;
    if (this.state.book == null || this.state.book == undefined || this.state.book.id != book.id) {
      this.state.metadata = null;
      this.state.output = null;
      isDirty = true;
    }
    this.state.book = book;

    if (this.state.quality != quality) {
      this.state.metadata = null;
      this.state.output = null;
      isDirty = true;
    }
    this.state.quality_index = RestKit.QualityKey.indexOf(quality);
    this.state.quality = quality;

    if (this.state.output == null || this.state.output == undefined) {
      this.state.metadata = null;
      this.state.output = null;
      isDirty = true;
    }
    this.state.packable = packable;
    if (this.state.packable) {
      if (isDirty) {
        this.state.status = 'loading';
        RestKit.LoadBookMetaData(this.state.book.id, this.state.quality, this.handleMetaDataReceived);
      } else {
        this.state.status = 'done';
        if (PackableMetaData[this.state.book.id] == null) {
          PackableMetaData[this.state.book.id] = this.state.output;
          EventDispatcher.dispatch(EventIDs.OnBookPackableUpdated, null);
        }
      }
    } else {
      this.state.status = 'off';
      if (PackableMetaData[this.state.book.id] != null) {
        PackableMetaData[this.state.book.id] = null;
        EventDispatcher.dispatch(EventIDs.OnBookPackableUpdated, null);
      }
    }
  }
  handleTouchTap(event) {
    event.preventDefault();
    this.state.open = true;
    this.state.anchorEl = event.currentTarget;
    this.setState(this.state);
  }
  handleRequestClose(event, data) {
    this.state.open = false;
    this.setState(this.state);
  }
  handleQualitySelect(event, item, index) {
    this.handleReceivedBookData(this.state.book, RestKit.QualityKey[index], this.state.packable);
    this.setState(this.state);
  }
  handleMetaDataReceived(status, response) {
    if (status) {
      if (response != null) {
        this.state.metadata = response;
        this.state.status = 'calculating';
        this.setState(this.state);
        KamanPacker.getPackageMetaData(response, this.handlePackageMetaData);
      } else {
        this.state.metadata = null;
        this.state.status = 'error';
        this.setState(this.state);
      }
    }
  }
  handleDefaultQualityChange(params) {
    this.handleReceivedBookData(this.state.book, params.quality, this.state.packable);
    this.setState(this.state);
  }
  handlePackageMetaData(params) {
    this.state.status = 'done';
    this.state.output = params;
    if (this.state.packable) {
      PackableMetaData[this.state.book.id] = this.state.output;
    } else {
      PackableMetaData[this.state.book.id] = null;
    }
    EventDispatcher.dispatch(EventIDs.OnBookPackableUpdated, null);
    this.setState(this.state);
  }
  handleToggleItem(event, status) {
    this.handleReceivedBookData(this.state.book, this.state.quality, status);
    this.setState(this.state);
  }

  render() {
    var quality_items = [];
    each(RestKit.QualityLabel, (element, index, next) => {
      quality_items.push(<MenuItem key={"quality-"+index} value={index} primaryText={element} />);
    });
    var status_items = <div></div>;
    if (this.state.packable) {
      if (this.state.status == 'calculating' || this.state.status == 'loading') {
        status_items =
          <div style={ChipWrapper.wrapper}>
            <Chip labelColor={'#fff'} backgroundColor={'#'+this.state.book.color} style={ChipWrapper.chip}>
              <Avatar color="#444" icon={<AvVideoLibrary />} />{<Spinner characterStyle={{ fontSize: 20, color: '#fff' }} />}
            </Chip>
            <Chip labelColor={'#fff'} backgroundColor={'#'+this.state.book.color} style={ChipWrapper.chip}>
              <Avatar color="#444" icon={<AvLibraryBooks />} />{<Spinner characterStyle={{ fontSize: 20, color: '#fff' }} />}
            </Chip>
            <Chip labelColor={'#fff'} backgroundColor={'#'+this.state.book.color} style={ChipWrapper.chip}>
              <Avatar color="#444" icon={<ActionSpellcheck />} />{<Spinner characterStyle={{ fontSize: 20, color: '#fff' }} />}
            </Chip>
          </div>;
      } else if (this.state.status == 'done') {
        status_items =
          <div style={ChipWrapper.wrapper}>
            <Chip labelColor={'#fff'} backgroundColor={'#'+this.state.book.color} style={ChipWrapper.chip}>
              <Avatar color="#9539B3" icon={<AvVideoLibrary />} />{this.state.output.videos_size}
            </Chip>
            <Chip labelColor={'#fff'} backgroundColor={'#'+this.state.book.color} style={ChipWrapper.chip}>
              <Avatar color="#57B339" icon={<AvLibraryBooks />} />{this.state.output.documents_size}
            </Chip>
            <Chip labelColor={'#fff'} backgroundColor={'#'+this.state.book.color} style={ChipWrapper.chip}>
              <Avatar  color="#B35839" icon={<ActionSpellcheck />} />{this.state.output.exams_size}
            </Chip>
          </div>;
      }
    }
    return (
      <TableRow>
        <TableRowColumn>{status_items}</TableRowColumn>
        <TableRowColumn  style={{width:'80px'}}>
          <FlatButton
            label={RestKit.QualityLabel[this.state.quality_index]}
            onTouchTap={this.handleTouchTap}
            />
          <Popover
            open={this.state.open}
            anchorEl={this.state.anchorEl}
            anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
            targetOrigin={{horizontal: 'left', vertical: 'top'}}
            onRequestClose={this.handleRequestClose}>
            <Menu onItemTouchTap={this.handleQualitySelect}>
              {quality_items}
            </Menu>
          </Popover>
        </TableRowColumn>
        <TableRowColumn style={{width:'200px'}}>
          <Checkbox
            label={<Chip labelColor={'#fff'} backgroundColor={'#'+this.state.book.color}>{this.state.book.title}</Chip>}
            defaultChecked={this.state.packable}
            labelPosition="left"
            onCheck={this.handleToggleItem}/>
        </TableRowColumn>
      </TableRow>
    );
  }
}
class FieldYearSelect extends Component {
  constructor(props) {
    super(props);
    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.handleYearChange = this.handleYearChange.bind(this);
  }

  handleFieldChange(event, index, value) {
    EventDispatcher.dispatch(EventIDs.OnStudyYearFieldFilterChanged, {year: this.props.year, field: value});
  }
  handleYearChange(event, index, value) {
    EventDispatcher.dispatch(EventIDs.OnStudyYearFieldFilterChanged, {year: value, field: this.props.field});
  }

  render() {
    var years = [], fields = [];
    each(RestKit.StudyFields, (value, key, object) => {
      fields.push(<MenuItem value={key} primaryText={value} key={"field-"+key}/>);
    });
    each(RestKit.StudyYears, (value, key, object) => {
      years.push(<MenuItem value={key} primaryText={value} key={"year-"+key}/>)
    });
    years = years.sort((a, b) => {
      return RestKit.StudyYearsOrder.indexOf(a.props.value) - RestKit.StudyYearsOrder.indexOf(b.props.value);
    });

    var field_selector = <div></div>;
    if (this.props.year == 2 || this.props.year == 4 || this.props.year == 8) {
      field_selector =
        <SelectField style={Styles.SelectFieldWidth} value={""+this.props.field} onChange={this.handleFieldChange}>
          {fields}
        </SelectField>
        ;
    }
    return (
      <div>
        <SelectField style={Styles.SelectFieldWidth} value={""+this.props.year} onChange={this.handleYearChange}>
          {years}
        </SelectField>
        {field_selector}
      </div>
      );
  }
}
class FooterSummery extends Component {
  constructor(props) {
    super(props);
    this.onBookPackableUpdated = this.onBookPackableUpdated.bind(this);
    this.state = {
    };
    EventDispatcher.register(EventIDs.OnBookPackableUpdated, this.onBookPackableUpdated);
  }

  onBookPackableUpdated(params) {
    this.setState(this.state);
  }

  render() {
    var videos_size = 0, videos_count = 0;
    var documents_size = 0, documents_count = 0;
    var exams_size = 0, exams_count = 0;
    var total_size = 0;
    each(PackableMetaData, function (element, index, next) {
      if (element != null) {
        videos_count += element.videos;
        videos_size += element.videos_bytes;
        documents_count += element.documents;
        documents_size += element.documents_bytes;
        exams_count += element.exams;
        exams_size += element.exams_bytes;
        total_size += element.videos_bytes + element.documents_bytes + element.exams_bytes;
      }
    });
    var videos_element = "۰";
    var documents_element = "۰";
    var exams_element = "۰";
    if (videos_count > 0 || documents_count > 0 || exams_count > 0) {
      videos_element = KamanPacker.getHumanReadableSize(videos_size);
      documents_element = KamanPacker.getHumanReadableSize(documents_size);
      exams_element = KamanPacker.getHumanReadableSize(exams_size);
    }
    let chip_size_style = {...ChipWrapper.chip, width: '180px'};

    return (
      <div>
        <div style={ChipWrapper.wrapper}>
          <Chip labelColor={'#fff'} backgroundColor={'#9539B3'} style={chip_size_style}>
            <Avatar color="#9539B3" icon={<AvVideoLibrary />} />
            {" مجموعا " + videos_count + " با حجم " + videos_element}
          </Chip>
          <Chip labelColor={'#fff'} backgroundColor={'#57B339'} style={chip_size_style}>
            <Avatar color="#57B339" icon={<AvLibraryBooks />} />
            {" مجموعا " + documents_count + " با حجم " + documents_element}
          </Chip>
          <Chip labelColor={'#fff'} backgroundColor={'#B35839'} style={chip_size_style}>
            <Avatar color="#B35839" icon={<ActionSpellcheck />} />
            {" مجموعا " + exams_count + " با حجم " + exams_element}
          </Chip>
        </div>
      </div>
    );
  }
}
class HomePage extends Component {
  constructor(props) {
    super(props);
    this.onStudyYearFieldUpdate = this.onStudyYearFieldUpdate.bind(this);
    this.handleTouchTap = this.handleTouchTap.bind(this);
    this.handleRequestClose = this.handleRequestClose.bind(this);
    this.handleToggleItem = this.handleToggleItem.bind(this);
    this.handleQualitySelect = this.handleQualitySelect.bind(this);
    this.state = {
      books: null,
      open: false,
      default_packable_change: false,
      default_packable: false,
      default_quality_index: 0,
      default_quality: 'base',
      year: 4,
      field: 2,
    };
    EventDispatcher.register(EventIDs.OnStudyYearFieldFilterChanged, this.onStudyYearFieldUpdate);
    this.onStudyYearFieldUpdate({field:this.state.field, year:this.state.year});
  }
  handleToggleItem(event, status) {
    if (this.state.default_packable_change) {
      this.state.default_packable = status;
      this.setState(this.state);
    } else {
      this.state.default_packable_change = true;
      this.state.default_packable = false;
      this.setState(this.state);
    }
  }
  handleTouchTap(event) {
    event.preventDefault();
    this.state.open = true;
    this.state.anchorEl = event.currentTarget;
    this.setState(this.state);
  }
  handleRequestClose(event, data) {
    this.state.open = false;
    this.setState(this.state);
  }
  handleQualitySelect(event: object, menuItem: object, index: number) {
    this.state.default_quality_index = index;
    this.state.default_quality = RestKit.QualityKey[index];
    this.state.open = false;
    this.setState(this.state);
  }

  onStudyYearFieldUpdate(params) {
    this.state.year = params.year;
    this.state.field = params.field;
    RestKit.LoadBooks(params.year, params.field, function(status, response) {
      if (status) {
        this.state.books = response;
        this.state.open = false;
        this.state.default_quality_index = 0;
        this.state.default_quality = 'base';
        this.handleToggleItem(null, this.state.packable);
      }
    }.bind(this));
  }

  render() {
    let TableStyle = {...BooksHorizontalStyle, height: this.props.windowHeight - 340};
    var items = null;
    if (this.state.books != null) {
      items = [];
      each(this.state.books, function (element, index, next) {
        if (element != undefined && element.publish_status == 2) {
          items.push(<BookSmallListItem book={element}
                                        key={"book"+index}
                                        quality={this.state.default_quality}
                                        default_packable={this.state.default_packable}/>);
        }
      }.bind(this));
    }
    var quality_items = [];
    each(RestKit.QualityLabel, (element, index, next) => {
      quality_items.push(<MenuItem key={"quality-"+index} value={index+1} primaryText={element}/>);
    });

    return (
      <div>
        <AppBar
          style={{direction: 'rtl'}}
          title="آکادمی کمان"
          iconElementLeft={<div></div>}
          iconElementRight={<FieldYearSelect field={this.state.field} year={this.state.year} />}
        />
        <Paper zDepth={2} style={{padding:'5px', margin:'15px'}}>
          <Table>
            <TableHeader displaySelectAll={false}>
              <TableRow selected={true}>
                <TableHeaderColumn>
                  <FooterSummery />
                </TableHeaderColumn>
                <TableHeaderColumn style={{width:'80px'}}>
                  <FlatButton
                    label={RestKit.QualityLabel[this.state.default_quality_index]}
                    onTouchTap={this.handleTouchTap}
                  />
                  <Popover
                    open={this.state.open}
                    anchorEl={this.state.anchorEl}
                    anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                    targetOrigin={{horizontal: 'left', vertical: 'top'}}
                    onRequestClose={this.handleRequestClose}>
                    <Menu onItemTouchTap={this.handleQualitySelect}>
                      {quality_items}
                    </Menu>
                  </Popover>
                </TableHeaderColumn>
                <TableHeaderColumn style={{width:'200px'}}>
                  <Checkbox
                    label="کتاب های پک"
                    defaultChecked={this.state.default_packable}
                    labelPosition="left"
                    onCheck={this.handleToggleItem}/>
                </TableHeaderColumn>
              </TableRow>
            </TableHeader>
          </Table>
          <div style={TableStyle}>
            <Table>
              <TableBody>
                {items}
              </TableBody>
            </Table>
          </div>
        </Paper>
      </div>
    );
  }
}
module.exports = HomePage;
