'use strict';

viewModel.AnalyticPowerCurve = new Object();
var page = viewModel.AnalyticPowerCurve;

page.turbineList = ko.observableArray([]);
page.downList = ko.observableArray([]);
page.dtLineChart = ko.observableArray([]);
page.projectList = ko.observableArray([
    { "value": 1, "text": "WindFarm-01" },
    { "value": 2, "text": "WindFarm-02" },
]);

page.isMain = ko.observable(true);
page.isDetail = ko.observable(false);
page.detailTitle = ko.observable("");
page.detailStartDate = ko.observable("");
page.detailEndDate = ko.observable("");

page.isClean = ko.observable(true);
page.idName = ko.observable("");
page.isDeviation = ko.observable(true);
page.sScater = ko.observable(false);
page.showDownTime = ko.observable(false);
page.deviationVal = ko.observable("20");
page.viewSession = ko.observable("");
page.turbine = ko.observableArray([]);

page.backToMain = function () {
    page.isMain(true);
    page.isDetail(false);
}
page.toDetail = function (selected) {
    page.isMain(false);
    page.isDetail(true);
    Data.InitCurveDetail(selected);
}
page.populateTurbine = function(){
    page.turbine([]);
    if(fa.turbine == ""){
        $.each(fa.turbineList(), function(i, val){
            if (i > 0){
                page.turbine.push(val.text);
            }
        });
    }else{
        page.turbine(fa.turbine);
    }

}

page.ExportPowerCurvePdf = function () {
    var chart = $("#powerCurve").getKendoChart();
    chart.exportPDF({ paperSize: "auto", margin: { left: "1cm", top: "1cm", right: "1cm", bottom: "1cm" } }).done(function (data) {
        kendo.saveAs({
            dataURI: data,
            fileName: "PowerCurve.pdf",
        });
    });
}
page.ExportPowerCurveDetailPdf = function () {
    var chart = $("#powerCurveDetail").getKendoChart();
    chart.exportPDF({ paperSize: "auto", margin: { left: "1cm", top: "1cm", right: "1cm", bottom: "1cm" } }).done(function (data) {
        kendo.saveAs({
            dataURI: data,
            fileName: "DetailPowerCurve.pdf",
        });
    });
}

vm.currentMenu('Power Curve');
vm.currentTitle('Power Curve');
vm.breadcrumb([{ title: 'Analysis', href: '#' }, { title: 'Power Curve', href: viewModel.appName + 'page/analyticpowercurve' }]);

var dataPowerCurve
var dataTurbine

var Data = {
    LoadData: function () {
        fa.LoadData();
        fa.getProjectInfo();
        page.populateTurbine();
        this.InitLinePowerCurve();
        this.InitRightTurbineList();
    },
    InitLinePowerCurve: function () {
        page.deviationVal($("#deviationValue").val());

        var link = "analyticpowercurve/getlistpowercurvescada"

        app.loading(true);
        var param = {
            period: fa.period,
            dateStart: fa.dateStart,
            dateEnd: fa.dateEnd,
            turbine: fa.turbine,
            project: fa.project,
            isClean: page.isClean,
            isDeviation: page.isDeviation,
            DeviationVal: page.deviationVal,
            ViewSession: page.viewSession
        };

        toolkit.ajaxPost(viewModel.appName + link, param, function (res) {
            if (!app.isFine(res)) {
                app.loading(false);
                return;
            }

            dataTurbine = res.data.Data;
            localStorage.setItem("dataTurbine", JSON.stringify(res.data.Data));
            page.dtLineChart(res.data.Data);

            $('#powerCurve').html("");
            $("#powerCurve").kendoChart({
                theme: "flat",
                title: {
                    text: ""
                },
                legend: {
                    position: "bottom",
                    visible: false,
                },
                seriesDefaults: {
                    type: "scatterLine",
                    style: "smooth",
                    dashType: "longDash",
                    markers: {
                        visible: false,
                        size: 4,
                    },
                },
                seriesColors: colorField,
                series: dataTurbine,
                categoryAxis: {
                    labels: {
                        step: 1
                    }
                },
                valueAxis: [{
                    labels: {
                        format: "N2",
                    }
                }],
                xAxis: {
                    majorUnit: 1,
                    title: {
                        text: "Wind Speed (m/s)",
                        font: '14px Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                        color: "#585555",
                        visible: true,
                    },
                    crosshair: {
                        visible: true,
                        tooltip: {
                            visible: true,
                            format: "N2",
                            background: "rgb(255,255,255, 0.9)",
                            color: "#58666e",
                            font: 'Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                            border: {
                                color: "#eee",
                                width: "2px",
                            },
                        }
                    },
                    majorGridLines: {
                        visible: true,
                        color: "#eee",
                        width: 0.8,
                    },
                    max: 25
                },
                yAxis: {
                    title: {
                        text: "Generation (KW)",
                        font: '14px Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                        color: "#585555"
                    },
                    labels: {
                        format: "N2",
                    },
                    axisCrossingValue: -5,
                    majorGridLines: {
                        visible: true,
                        color: "#eee",
                        width: 0.8,
                    },
                    crosshair: {
                        visible: true,
                        tooltip: {
                            visible: true,
                            format: "N2",
                            background: "rgb(255,255,255, 0.9)",
                            color: "#58666e",
                            font: 'Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                            border: {
                                color: "#eee",
                                width: "2px",
                            },
                        }
                    },
                },
                tooltip: {
                    visible: true,
                    format: "{1}in {0} minutes",
                    template: "#= series.name #",
                    shared: true,
                    background: "rgb(255,255,255, 0.9)",
                    color: "#58666e",
                    font: 'Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                    border: {
                        color: "#eee",
                        width: "2px",
                    },

                }
            });
            app.loading(false);
            $("#powerCurve").data("kendoChart").refresh();
            page.ShowHideAfterInitChart();
            if (page.sScater()) {
                $('#showDownTime').removeAttr("disabled");
            } else {
                $('#showDownTime').attr('checked', false);
                $('#showDownTime').attr("disabled", "disabled");
            }
            if (page.sScater()) { 
                Data.getPowerCurve(); 
            }
        });
    },
    getPowerCurve: function () {
        page.deviationVal($("#deviationValue").val());
        var turbineList = [];
        var kolor = [];
        var kolorDeg = [];

        var len = $('input[id*=chk-][type=checkbox]:checked').length;

        for (var a = 0; a < len; a++) {
            var chk = $('input[id*=chk-][type=checkbox]:checked')[a].name;
            turbineList.push(chk);
            var even = _.find(page.turbineList(), function (nm) { return nm.turbine == chk });
            kolor.push(even.color);
            var indOf = colorField.indexOf(even.color);
            kolorDeg.push(colorDegField[indOf]);
        }

        var dtLine = JSON.parse(localStorage.getItem("dataTurbine"));

        app.loading(true);
        var param = {
            period: fa.period,
            dateStart: fa.dateStart,
            dateEnd: fa.dateEnd,
            turbine: turbineList,
            project: fa.project,
            Color: kolor,
            ColorDeg: kolorDeg,
            isDeviation: page.isDeviation,
            deviationVal: page.deviationVal,
            IsDownTime: page.showDownTime(),
            ViewSession: page.viewSession()
        };
        toolkit.ajaxPost(viewModel.appName + "analyticpowercurve/getpowercurve", param, function (res) {

            var dataPowerCurves = res.data.Data;
            var dtSeries = new Array();
            if (dataPowerCurves != null) {
                if (dataPowerCurves.length > 0) {
                    dtSeries = dtLine.concat(dataPowerCurves);
                }
            } else {
                dtSeries = dtLine;
            }

            $('#powerCurve').html("");
            $("#powerCurve").kendoChart({
                theme: "flat",
                title: {
                    text: ""
                },
                legend: {
                    visible: false,
                    position: "top"
                },
                seriesDefaults: {
                    type: "scatter",
                    style: "smooth",
                },
                series: dtSeries,
                categoryAxis: {
                    labels: {
                        step: 1
                    }
                },
                valueAxis: [{
                    labels: {
                        format: "N2",
                    }
                }],
                xAxis: {
                    majorUnit: 1,
                    title: {
                        text: "Wind Speed (m/s)",
                        font: '14px Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                        color: "#585555"
                    },
                    majorGridLines: {
                        visible: true,
                        color: "#eee",
                        width: 0.8,
                    },
                    crosshair: {
                        visible: true,
                        tooltip: {
                            visible: true,
                            format: "N2",
                            background: "rgb(255,255,255, 0.9)",
                            color: "#58666e",
                            font: 'Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                            border: {
                                color: "#eee",
                                width: "2px",
                            },
                        }
                    },
                    max: 25
                },
                yAxis: {
                    title: {
                        text: "Generation (KW)",
                        font: '14px Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                        color: "#585555"
                    },
                    labels: {
                        format: "N2",
                    },
                    axisCrossingValue: -5,
                    majorGridLines: {
                        visible: true,
                        color: "#eee",
                        width: 0.8,
                    },
                    crosshair: {
                        visible: true,
                        tooltip: {
                            visible: true,
                            format: "N2",
                            background: "rgb(255,255,255, 0.9)",
                            color: "#58666e",
                            font: 'Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                            border: {
                                color: "#eee",
                                width: "2px",
                            },
                        }
                    },
                }
            });

            app.loading(false);
            if (page.showDownTime()) {
                $('#downtime-list').show();
            } else {
                $('#downtime-list').hide();
            }
            page.ShowHideAfterInitChart();
            // $("#powerCurve").data("kendoChart").refresh(); 
        });
    },
    InitCurveDetail: function (selected) {
        app.loading(true);
        page.detailTitle(selected);
        page.detailStartDate(fa.dateStart.getUTCDate() + "-" + fa.dateStart.getMonthNameShort() + "-" + fa.dateStart.getUTCFullYear());
        page.detailEndDate(fa.dateEnd.getUTCDate() + "-" + fa.dateStart.getMonthNameShort() + "-" + fa.dateEnd.getUTCFullYear());

        var colorDetail = [];
        var colD = _.find(page.turbineList(), function(num){ return num.turbine == selected; }).color;
        if(colD != undefined){
            colorDetail.push(colD);
        }

        var param = {
            period: fa.period,
            dateStart: fa.dateStart,
            dateEnd: fa.dateEnd,
            turbine: [selected],
            project: fa.project,
            Color: colorDetail
        };

        var dataTurbineDetail

        toolkit.ajaxPost(viewModel.appName + "analyticpowercurve/getdetails", param, function (res) {
            if (!app.isFine(res)) {
                app.loading(false);
                return;
            }

            dataTurbineDetail = res.data.Data;

            $('#powerCurveDetail').html("");
            $("#powerCurveDetail").kendoChart({
                theme: "flat",
                title: {
                    text: ""
                },
                legend: {
                    visible: false,
                    position: "top"
                },
                seriesDefaults: {
                    type: "scatter",
                    style: "smooth",
                },
                series: dataTurbineDetail,
                categoryAxis: {
                    labels: {
                        step: 1
                    }
                },
                valueAxis: [{
                    labels: {
                        format: "N2",
                    }
                }],
                xAxis: {
                    majorUnit: 1,
                    title: {
                        text: "Wind Speed (m/s)",
                        font: '14px Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                        color: "#585555"
                    },
                    majorGridLines: {
                        visible: true,
                        color: "#eee",
                        width: 0.8,
                    },
                    crosshair: {
                        visible: true,
                        tooltip: {
                            visible: true,
                            format: "N2",
                            background: "rgb(255,255,255, 0.9)",
                            color: "#58666e",
                            font: 'Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                            border: {
                                color: "#eee",
                                width: "2px",
                            },
                        }
                    },
                    max: 25
                },
                yAxis: {
                    title: {
                        text: "Generation (KW)",
                        font: '14px Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                        color: "#585555"
                    },
                    labels: {
                        format: "N2",
                    },
                    axisCrossingValue: -5,
                    majorGridLines: {
                        visible: true,
                        color: "#eee",
                        width: 0.8,
                    },
                    crosshair: {
                        visible: true,
                        tooltip: {
                            visible: true,
                            format: "N2",
                            background: "rgb(255,255,255, 0.9)",
                            color: "#58666e",
                            font: 'Source Sans Pro, Lato , Open Sans , Helvetica Neue, Arial, sans-serif',
                            border: {
                                color: "#eee",
                                width: "2px",
                            },
                        }
                    },
                }
            });
            app.loading(false);

            $("#powerCurveDetail").data("kendoChart").refresh();
        });
    },
    InitRightTurbineList: function () {
        page.turbineList([]);

        $.each(page.turbine(), function (i, val) {
            var data = {
                color: colorField[i + 1],
                turbine: val
            }
            page.turbineList.push(data);
        });

        if (page.turbine().length > 1) {
            $("#showHideChk").html('<label>' +
                '<input type="checkbox" id="showHideAll" checked onclick="page.showHideAllLegend(this)" >' +
                '<span class="cr"><i class="cr-icon glyphicon glyphicon-ok"></i></span>' +
                '<span id="labelShowHide"><b>Select All</b></span>' +
                '</label>');
        } else {
            $("#showHideChk").html("");
        }

        $("#right-turbine-list").html("");
        $.each(page.turbineList(), function (idx, val) {
            $("#right-turbine-list").append('<div class="btn-group">' +
                '<button class="btn btn-default btn-sm turbine-chk" type="button" onclick="page.showHideLegend(' + (idx + 1) + ')" style="border-color:' + val.color + ';background-color:' + val.color + '"><i class="fa fa-check" id="icon-' + (idx + 1) + '"></i></button>' +
                '<input class="chk-option" type="checkbox" name="' + val.turbine + '" checked id="chk-' + (idx + 1) + '" hidden>' +
                '<button class="btn btn-default btn-sm turbine-btn" onclick="page.toDetail(\'' + val.turbine + '\')" type="button" style="width:70px">' + val.turbine + '</button>' +
                '</div>');
        });
    },
    InitDownList: function () {
        toolkit.ajaxPost(viewModel.appName + "analyticpowercurve/getdownlist", "", function (res) {
            if (!app.isFine(res)) {
                app.loading(false);
                return;
            }
            page.downList(res.data);

            $("#downtime-list").html("");
            $.each(page.downList(), function (idx, val) {
                $("#downtime-list").append('<div class="btn-group">' +
                    '<button class="btn btn-default btn-sm down-chk" id="down-' + val.down + '" type="button" style="border-color:' + val.color + ';background-color:' + val.color + '"><i class="fa fa-check" id="icon-down-' + val.down + '"></i></button>' +
                    '<input class="chk-option" type="checkbox" name="' + val.down + '" checked id="down-check-' + val.down + '" hidden>' +
                    '<label class="btn btn-default btn-sm turbine-btn">&nbsp;&nbsp;' + val.label + '&nbsp;&nbsp;</label>' +
                    '</div>'
                );
            });

            $('#downtime-list').hide();
        });
    },
    SetDownOnClick: function () {
        $.each($("#powerCurve").data("kendoChart").options.series, function (idx, val) {
            $.each($("#downtime-list").find('button[id^="down-"]'), function (idx2, val2) {
                if (("down-" + val.name) == val2.id) {
                    $(val2).attr('onclick', 'page.showHideDown(' + idx + ', "' + val.name + '")');
                    $(val2).find('i').css("visibility", "visible")
                    $('#down-check-' + val.name).prop('checked', true);
                }
            });
        });
    },

};

page.showHideAllLegend = function (e) {
    if (e.checked == true) {
        $('.fa-check').css("visibility", 'visible');
        $.each(page.turbine(), function (i, val) {
            $("#powerCurve").data("kendoChart").options.series[i + 1].visible = true;
        });
        $('#labelShowHide b').text('Select All');
    } else {
        $.each(page.turbine(), function (i, val) {
            $("#powerCurve").data("kendoChart").options.series[i + 1].visible = false;
        });
        $('.fa-check').css("visibility", 'hidden');
        $('#labelShowHide b').text('Select All');
    }
    $('.chk-option').not(e).prop('checked', e.checked);
    $("#powerCurve").data("kendoChart").redraw();
}

page.showHideLegend = function (idx) {
    $('#chk-' + idx).trigger('click');
    var chart = $("#powerCurve").data("kendoChart");
    // var datas = $("#powerCurve").data("kendoChart").options.series;
    // var Nama = $("#powerCurve").data("kendoChart").options.series[idx].name;

    if (page.sScater()) {
        var len = $('input[id*=chk-][type=checkbox]:checked').length;
        if (len > 3) {
            $('#chk-' + idx).prop('checked', false);
            swal('Warning', 'You can only select 3 turbines !', 'warning');
            return
        }
        Data.InitLinePowerCurve();
        // var scatterIndex = _.find(datas, function(num){ return num.name == 'Scatter-' + Nama; }).index;
        // chart._legendItemClick(scatterIndex);
    }

    if ($('input[id*=chk-][type=checkbox]:checked').length == $('input[id*=chk-][type=checkbox]').length) {
        $('#showHideAll').prop('checked', true);
    } else {
        $('#showHideAll').prop('checked', false);
    }

    if ($('#chk-' + idx).is(':checked')) {
        $('#icon-' + idx).css("visibility", "visible");
    } else {
        $('#icon-' + idx).css("visibility", "hidden");
    }
    if (idx == $('input[id*=chk-][type=checkbox]').length) {
        idx == 0
    }

    chart._legendItemClick(idx);
}

page.ShowHideAfterInitChart = function () {
    var len = $('input[id*=chk-][type=checkbox]').length;
    var chart = $("#powerCurve").data("kendoChart");
    for (var i = 1; i <= len; i++) {
        if (!$('#chk-' + i).is(':checked')) {
            chart.options.series[i].visible = false;
        }
    }
    $("#powerCurve").data("kendoChart").redraw();
}

page.hideAll = function () {
    // var chart = $("#powerCurve").data("kendoChart");
    var len = $('input[id*=chk-][type=checkbox]').length;
    for (var i = 1; i <= len; i++) {
        $('#icon-' + i).css("visibility", "hidden");
        $('#chk-' + i).prop('checked', false);
    }
}

page.HideforScatter = function () {
    var len = $('input[id*=chk-][type=checkbox]:checked').length;

    var sScater = page.sScater();
    if (sScater) {
        $('#showHideChk').hide();
        $('#showHideAll').prop('checked', false);
        if (len > 3) {
            page.hideAll();
            $('#icon-1').css("visibility", "visible");
            $('#chk-1').prop('checked', true);
        }
    } else {
        $('#showHideChk').show();
        $('#showHideAll').prop('checked', true);
    }
}





$(document).ready(function () {
    $('#btnRefresh').on('click', function () {
        app.loading(true);
        setTimeout(function () {
            Data.LoadData();
            // Data.InitLinePowerCurve();
            // if (page.sScater()) { 
            //     Data.getPowerCurve(); 
            // }

        }, 1000);
    });

    app.loading(true);
    
    setTimeout(function () {
        Data.LoadData();
    }, 1000);

    $("input[name=isAvg]").on("change", function () {
        page.viewSession(this.id);
        Data.InitLinePowerCurve();

    });

    $('#isClean').on('click', function () {
        var isClean = $('#isClean').prop('checked');
        page.isClean(isClean);
        Data.InitLinePowerCurve();
    });

    $('#isDeviation').on('click', function () {
        var isDeviation = $('#isDeviation').prop('checked');
        page.isDeviation(isDeviation);
        Data.InitLinePowerCurve();
    });

    $('#sScater').on('click', function () {
        var sScater = $('#sScater').prop('checked');
        page.sScater(sScater);
        page.HideforScatter();
        Data.InitLinePowerCurve();
    });

    $('#showDownTime').on('click', function () {
        var isShow = $('#showDownTime').prop('checked');
        page.showDownTime(isShow);
        Data.InitLinePowerCurve();
    });

    $('#showDownTime').attr("disabled", "disabled");
    Data.InitDownList();    
});
