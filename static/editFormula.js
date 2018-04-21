var EditFormula = {
    generate:function (node) {
        var res = $('<div></div>');
        var formula = $('<textarea class="formText nodeFormula"></textarea>').val(node.data.formula);
        var testedFormula = formula;
        var testTimeout = 0;
        function testFormula() {
            node.data.formula = formula.val();
            var params = {json:1, 'data':node.data, 'connections':node.data.connections};
            $.post('/constructor/file/'+desktop.file.id+'/precalc',params,function (res) {
                if (res['status']=='ok') {
                    if (res.data.data) {
						errorInfo.hide();
                        node.data.data = res.data.data;
                        updateResults();
                    } else {
						errorInfo.html("<strong>Ошибка рассчета:</strong><br/>Подробности не известны");
						errorInfo.show();
					}
                } else {
					node.data.data = {};
					updateResults();
					errorInfo.html("<strong>Ошибка рассчета:</strong><br/>"+res.data.data);
					errorInfo.show();
				}
            },'json');
        }
        setTimeout(testFormula,500);
        formula.keyup(function () {
            if (formula.val()!=testedFormula) {
                clearTimeout(testTimeout);
                testTimeout = setTimeout(testFormula, 500);
            }
        });
        res.append(formula);
		var errorInfo = $('<div class="errors"></div>').hide();
		res.append(errorInfo);
        var resultsTable = $('<table class="data"></table>');
        function updateResults() {
            resultsTable.empty();
            if (node.data.data) {
                var tr,tr1;
                tr = $('<tr></tr>');tr1 = $('<tr></tr>');
                for (var i in node.data.data) {
                    tr.append($('<td></td>').text(i));
                    tr1.append($('<td></td>').text(node.data.data[i]));
                }
                resultsTable.append(tr);
                resultsTable.append(tr1);
            } else {
                resultsTable.append('<tr><td>Результат не рассчитан</td></tr>');
            }
        }
        updateResults();
        res.append(resultsTable);
        return res;
    }
}