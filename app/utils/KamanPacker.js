/**
 * Created by peyman on 8/28/16.
 */

var each = require('foreach');

var KamanPacker = {

  getPackageMetaData: function(metadata, callback) {
    var videos_size = 0,
        documents_size = 0,
        videos_count = 0,
        documents_count = 0,
        exams_count = 0,
        questions_count = 0,
        questions_size = 0, answers_size = 0, tips_size = 0;
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
