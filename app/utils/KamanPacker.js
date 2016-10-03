/**
 * Created by peyman on 8/28/16.
 */

const each = require('foreach');
const fs = require('fs');
var NodeZip = require('node-zip');

var KamanPacker = {

  WriteBufferSegmentSize: 1024 * 1024 * 255,
  ReadBufferSize: 1024*10,

  WriteDestinationDirectory: null,
  WriteFilename: null,
  WriteBuffer: null,
  WriteBufferIndexer: 0,
  WriteBufferCurrentSize: 0,
  WriteDictionary: {},

  StartNewBuffer() {
    this.WriteBufferCurrentSize = 0;
    this.WriteBufferIndexer += 1;
    this.WriteFilename = '00' + this.WriteBufferIndexer + '.package';
    return fs.openSync(this.WriteDestinationDirectory + '/' + this.WriteFilename, 'w');
  },
  CloseBuffer(fd) {
    return fs.closeSync(fd);
  },

  WritePackage: function (metadata_obj, source_directory, dest_directory, callback_progress) {
    this.WriteBufferIndexer = 0;
    this.WriteDestinationDirectory = dest_directory;
    this.WriteDictionary = {};
    this.WriteBuffer = this.StartNewBuffer();

    console.log('Packaging from: ' + source_directory + ' to: ' + dest_directory);
    each(metadata_obj, (element, index, next) => {
      if (element != null) {
        this.WriteBook(element.meta, source_directory, callback_progress);
      }
    });
    this.CloseBuffer(this.WriteBuffer);
    console.log(this.WriteDictionary);
    fs.writeFileSync(this.WriteDestinationDirectory + '/package.kamanacademy', JSON.stringify(this.WriteDictionary));
  },

  WriteBook(metadata_obj, source_directory, callback_progress) {
    this.WriteBookVideos(metadata_obj.videos, source_directory, callback_progress);
    this.WriteBookDocuments(metadata_obj.documents, source_directory, callback_progress);
    this.WriteBookExams(metadata_obj.exams, source_directory, callback_progress);
  },
  WriteBookVideos(videos, source_directory, callback_progress) {
    each(videos, (element, index, next) => {
      if (element.publish_status == 2) {
        if (element.file != null && element.file != undefined) {
          let source_file_path = source_directory + '/videos/' + element.file.filename;
          if (fs.existsSync(source_file_path)) {
            this.WriteDictionary[element.id] = this.WriteDataFromFile(source_file_path, 'video', callback_progress);
          } else {
            source_file_path = source_directory + '/video_sources/' + element.file.filename;
            if (fs.existsSync(source_file_path)) {
              this.WriteDictionary[element.id] = this.WriteDataFromFile(source_file_path, 'video', callback_progress);
            } else {
              console.log('Source file does not exists: ' + source_file_path);
            }
          }
        }
      }
    });
  },
  WriteBookDocuments(documents, source_directory, callback_progress) {
    each(documents, (element, index, next) => {
      if (element.publish_status == 2) {
        if (element.file != null && element.file != undefined) {
          let source_file_path = source_directory + '/documents/' + element.file.filename;
          if (fs.existsSync(source_file_path)) {
            this.WriteDictionary[element.id] = this.WriteDataFromFile(source_file_path, 'document', callback_progress);
          } else {
            console.log('Source file does not exists: ' + source_file_path);
          }
        }
      }
    });
  },
  WriteBookExams(exams, source_directory, callback_progress) {
    each(exams, (element, index, next) => {
      if (element.publish_status == 2 && index <= 2) {
        let zip_file_path = this.WriteDestinationDirectory + '/' + element.id + "-" + index + '-tmp.zip';
        this.BuildExamZipFile(element.exam_def, source_directory, zip_file_path, callback_progress);
        this.WriteDictionary[element.id] = this.WriteDataFromFile(zip_file_path, 'exam', callback_progress);
        fs.unlinkSync(zip_file_path);
      }
    });
  },
  BuildExamZipFile(exam, source_directory, temp_file, callback_progress) {
    var zip = new NodeZip();
    var exam_meta = [];
    console.log('building zip file for ' + exam.questions.length + ' questions...');
    each(exam.questions, (question, index, next) => {
      if (question.answer_file != null) {
        var pdfFilePath = source_directory + '/documents/' + question.answer_file.filename;
        if (fs.existsSync(pdfFilePath)) {
          zip.file('a' + question.id + '.pdf', fs.readFileSync(pdfFilePath, 'binary'));
          question['a_filename'] = 'a' + question.id + '.pdf';
        }
      }
      if (question.tip_file != null) {
        var pdfFilePath = source_directory + '/documents/' + question.tip_file.filename;
        if (fs.existsSync(pdfFilePath)) {
          zip.file('t' + question.id + '.pdf', fs.readFileSync(pdfFilePath, 'binary'));
          question['t_filename'] = 't' + question.id + '.pdf';
        }
      }
      if (question.question_file != null) {
        var pdfFilePath = source_directory + '/documents/' + question.question_file.filename;
        if (fs.existsSync(pdfFilePath)) {
          zip.file('q' + question.id + '.pdf', fs.readFileSync(pdfFilePath, 'binary'));
          question['q_filename'] = 'q' + question.id + '.pdf';
        }
      }
      exam_meta.push(question);
    });
    zip.file("metadata.json", JSON.stringify({...exam, questions: exam_meta}));
    var data = zip.generate({base64:false,compression:'DEFLATE'});
    fs.writeFileSync(temp_file, data, 'binary');
  },
  WriteDataFromFile(filepath, type, callback_progress) {
    let read_handle = fs.openSync(filepath, 'r');
    let read_state = fs.fstatSync(read_handle);
    var meta = {
      size: read_state.size,
      offset: this.WriteBufferCurrentSize,
      filename: this.WriteFilename,
      type: type
    };
    if (read_handle != null && read_state.size > 0) {
      var buffer = new Buffer(this.ReadBufferSize);
      var read_size = 0;
      while (read_size < read_state.size) {
        let read_buffer_size = fs.readSync(read_handle, buffer, 0, this.ReadBufferSize, null);
        let write_buffer_size = fs.writeSync(this.WriteBuffer, buffer, 0, read_buffer_size, null);
        read_size += read_buffer_size;
        this.WriteBufferCurrentSize += write_buffer_size;
        if (write_buffer_size != read_buffer_size) {
          console.log('unsupported behave: ' + write_buffer_size + " <> " + read_buffer_size);
        }
      }
    }
    fs.closeSync(read_handle);
    return meta;
  },
  getPackageMetaData: function(metadata, callback) {
    var tire_amount,
        videos_size = 0,
        documents_size = 0,
        videos_count = 0,
        documents_count = 0,
        exams_count = 0,
        questions_count = 0,
        questions_size = 0, answers_size = 0, tips_size = 0;

    each(metadata.books, (element, index, next) => {
      if (element.publish_status == 2 && element.bundle != null && element.bundle.tire != null) {
        tire_amount += element.bundle.tire.price;
      }
    });
    each(metadata.videos, (element, index, next) => {
      if (element.publish_status == 2) {
        if (element.file != null && element.file != undefined) {
          videos_count += 1;
          videos_size += element.file.size;
        }
      }
    });
    each(metadata.documents, (element, index, next) => {
      if (element.publish_status == 2) {
        if (element.file != null && element.file != undefined) {
          documents_count += 1;
          documents_size += element.file.size;
        }
      }
    });
    each(metadata.exams, (element, index, next) => {
      if (element.publish_status == 2) {
        exams_count += 1;
        each(element.exam_def.questions, (qelement, qindex, qnext) => {
          questions_count += 1;
          if (qelement.question_file != undefined && qelement.question_file != null) {
            questions_size += qelement.question_file.size;
          }
          if (qelement.answer_file != undefined && qelement.answer_file != null) {
            answers_size += qelement.answer_file.size;
          }
          if (qelement.tip_file != undefined && qelement.tip_file != null) {
            tips_size += qelement.tip_file.size;
          }
        });
      }
    });

    callback({
      tire_amount: tire_amount,
      videos:videos_count , videos_size: this.getHumanReadableSize(videos_size), videos_bytes: videos_size,
      documents: documents_count, documents_size: this.getHumanReadableSize(documents_size), documents_bytes: documents_size,
      exams: exams_count, questions: questions_count, exams_size: this.getHumanReadableSize(questions_size+answers_size+tips_size), exams_bytes: questions_size+answers_size+tips_size,
    });
  },

  getHumanReadableSize: function (size) {
    var unit = ['بایت', 'کیلو', 'مگ', 'گیگ', 'ترا', 'پتا'];
    var indexer = 0;
    while (size > 1000) {
      size = size / 1000;
      indexer++;
    }
    return size.toFixed(2) + ' ' + unit[indexer];
  }
};
module.exports = KamanPacker;
