'use strict';

viewModel.Databrowser = new Object();
var dbr = viewModel.Databrowser;

dbr.turbineList = ko.observableArray([]);
dbr.modelList = ko.observableArray([
    { "value": 1, "text": "Regen" },
    { "value": 2, "text": "Suzlon" },
]);
dbr.projectList = ko.observableArray([
    { "value": 1, "text": "WindFarm-01" },
    { "value": 2, "text": "WindFarm-02" },
]);

dbr.gridColumnsScada = ko.observableArray([]);
dbr.gridColumnsScadaException = ko.observableArray([]);
dbr.gridColumnsScadaAnomaly = ko.observableArray([]);
dbr.filterJMR = ko.observableArray([]);
var turbineval = [];

dbr.populateTurbine = function () {
    app.ajaxPost(viewModel.appName + "/helper/getturbinelist", {}, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        if (res.data.length == 0) {
            res.data = [];
            dbr.turbineList([{ value: "", text: "" }]);
        } else {
            var datavalue = [];
            if (res.data.length > 0) {
                var allturbine = {}
                $.each(res.data, function (key, val) {
                    turbineval.push(val);
                });
                allturbine.value = "All Turbine";
                allturbine.text = "All Turbines";
                datavalue.push(allturbine);
                $.each(res.data, function (key, val) {
                    var data = {};
                    data.value = val;
                    data.text = val;
                    datavalue.push(data);
                });
            }
            dbr.turbineList(datavalue);
        }
        setTimeout(function () {
            $('#turbineMulti').data('kendoMultiSelect').value(["All Turbine"])
        }, 300);
    });
};

dbr.checkTurbine = function () {
    var arr = $('#turbineMulti').data('kendoMultiSelect').value();
    var index = arr.indexOf("All Turbine");
    if (index == 0 && arr.length > 1) {
        arr.splice(index, 1);
        $('#turbineMulti').data('kendoMultiSelect').value(arr)
    } else if (index > 0 && arr.length > 1) {
        $("#turbineMulti").data("kendoMultiSelect").value(["All Turbine"]);
    } else if (arr.length == 0) {
        $("#turbineMulti").data("kendoMultiSelect").value(["All Turbine"]);
    }
}

dbr.ShowHideColumnScada = function (gridID, field, id, index) {
    if ($('#' + id).is(":checked")) {
        $('#' + gridID).data("kendoGrid").showColumn(index);
    } else {
        $('#' + gridID).data("kendoGrid").hideColumn(index);
    }
}

var Data = {
    LoadData: function () {
        var dateStart = $('#dateStart').data('kendoDatePicker').value();
        var dateEnd = $('#dateEnd').data('kendoDatePicker').value();

        if ($("#turbineMulti").data("kendoMultiSelect").value() == "") {
            $('#turbineMulti').data('kendoMultiSelect').value(["All Turbine"])
        }

        if ((new Date(dateStart).getTime() > new Date(dateEnd).getTime())) {
            toolkit.showError("Invalid Date Range Selection");
            return;
        } else {
            app.loading(true);
            this.InitGrid();
            this.InitGridExceptionTimeDuration();
            this.InitGridAnomalies();
            this.InitGridAlarm();
            this.InitGridAlarmOverlapping();
            this.InitGridAlarmAnomalies();
            this.InitGridJMR();
            this.InitMet();
        }
    },
    LoadAvailDate: function () {
        app.ajaxPost(viewModel.appName + "/databrowser/getscadaavaildate", {}, function (res) {
            if (!app.isFine(res)) {
                return;
            }

            //Scada Data
            if (res.data.ScadaData.length == 0) {
                res.data.ScadaData = [];
            } else {
                if (res.data.ScadaData.length > 0) {
                    var minDatetemp = new Date(res.data.ScadaData[0]);
                    var maxDatetemp = new Date(res.data.ScadaData[1]);
                    $('#availabledatestartscada').html(kendo.toString(moment.utc(minDatetemp).format('DD-MMMM-YYYY')));
                    $('#availabledateendscada').html(kendo.toString(moment.utc(maxDatetemp).format('DD-MMMM-YYYY')));
                }
            }         
        });
        app.ajaxPost(viewModel.appName + "/databrowser/getalarmavaildate", {}, function (res) {
            if (!app.isFine(res)) {
                return;
            }

            //Alarm Data
            if (res.data.Alarm.length == 0) {
                res.data.Alarm = [];
            } else {
                if (res.data.Alarm.length > 0) {
                    var minDatetemp = new Date(res.data.Alarm[0]);
                    var maxDatetemp = new Date(res.data.Alarm[1]);
                    $('#availabledatestartalarm').html(kendo.toString(moment.utc(minDatetemp).format('DD-MMMM-YYYY')));
                    $('#availabledateendalarm').html(kendo.toString(moment.utc(maxDatetemp).format('DD-MMMM-YYYY')));
                }
            } 
        });
        app.ajaxPost(viewModel.appName + "/databrowser/getjmravaildate", {}, function (res) {
            if (!app.isFine(res)) {
                return;
            }

            //JMR Data
            if (res.data.JMR.length == 0) {
                res.data.JMR = [];
            } else {
                if (res.data.JMR.length > 0) {
                    var minDatetemp = new Date(res.data.JMR[0]);
                    var maxDatetemp = new Date(res.data.JMR[1]);
                    $('#availabledatestartjmr').html(kendo.toString(moment.utc(minDatetemp).format('DD-MMMM-YYYY')));
                    $('#availabledateendjmr').html(kendo.toString(moment.utc(maxDatetemp).format('DD-MMMM-YYYY')));
                }
            }
        });
        app.ajaxPost(viewModel.appName + "/databrowser/getmetavaildate", {}, function (res) {
            if (!app.isFine(res)) {
                return;
            }

            //MET Tower Data
            if (res.data.MET.length == 0) {
                res.data.MET = [];
            } else {
                if (res.data.MET.length > 0) {
                    var minDatetemp = new Date(res.data.MET[0]);
                    var maxDatetemp = new Date(res.data.MET[1]);
                    $('#availabledatestartmet').html(kendo.toString(moment.utc(minDatetemp).format('DD-MMMM-YYYY')));
                    $('#availabledateendmet').html(kendo.toString(moment.utc(maxDatetemp).format('DD-MMMM-YYYY')));
                }
            }
        });
        app.ajaxPost(viewModel.appName + "/databrowser/getdurationavaildate", {}, function (res) {
            if (!app.isFine(res)) {
                return;
            }

            //Duration Data
            if (res.data.Duration.length == 0) {
                res.data.Duration = [];
            } else {
                if (res.data.Duration.length > 0) {
                    var minDatetemp = new Date(res.data.Duration[0]);
                    var maxDatetemp = new Date(res.data.Duration[1]);
                    $('#availabledatestartduration').html(kendo.toString(moment.utc(minDatetemp).format('DD-MMMM-YYYY')));
                    $('#availabledateendduration').html(kendo.toString(moment.utc(maxDatetemp).format('DD-MMMM-YYYY')));
                }
            }
        });
        app.ajaxPost(viewModel.appName + "/databrowser/getscadaanomalyavaildate", {}, function (res) {
            if (!app.isFine(res)) {
                return;
            }

            //Scada Anomaly Data
            if (res.data.ScadaAnomaly.length == 0) {
                res.data.ScadaAnomaly = [];
            } else {
                if (res.data.ScadaAnomaly.length > 0) {
                    var minDatetemp = new Date(res.data.ScadaAnomaly[0]);
                    var maxDatetemp = new Date(res.data.ScadaAnomaly[1]);
                    $('#availabledatestartscadaanomaly').html(kendo.toString(moment.utc(minDatetemp).format('DD-MMMM-YYYY')));
                    $('#availabledateendscadaanomaly').html(kendo.toString(moment.utc(maxDatetemp).format('DD-MMMM-YYYY')));
                }
            }
        });
        app.ajaxPost(viewModel.appName + "/databrowser/getalarmoverlappingavaildate", {}, function (res) {
            if (!app.isFine(res)) {
                return;
            }

            //AlarmOverlapping Data
            if (res.data.AlarmOverlapping.length == 0) {
                res.data.AlarmOverlapping = [];
            } else {
                if (res.data.AlarmOverlapping.length > 0) {
                    var minDatetemp = new Date(res.data.AlarmOverlapping[0]);
                    var maxDatetemp = new Date(res.data.AlarmOverlapping[1]);
                    $('#availabledatestartalarmoverlapping').html(kendo.toString(moment.utc(minDatetemp).format('DD-MMMM-YYYY')));
                    $('#availabledateendalarmoverlapping').html(kendo.toString(moment.utc(maxDatetemp).format('DD-MMMM-YYYY')));
                }
            }
        });
        app.ajaxPost(viewModel.appName + "/databrowser/getalarmscadaanomalyavaildate", {}, function (res) {
            if (!app.isFine(res)) {
                return;
            }

            //AlarmScadaAnomaly Data
            if (res.data.AlarmScadaAnomaly.length == 0) {
                res.data.AlarmScadaAnomaly = [];
            } else {
                if (res.data.AlarmScadaAnomaly.length > 0) {
                    var minDatetemp = new Date(res.data.AlarmScadaAnomaly[0]);
                    var maxDatetemp = new Date(res.data.AlarmScadaAnomaly[1]);
                    $('#availabledatestartalarmscadaanomaly').html(kendo.toString(moment.utc(minDatetemp).format('DD-MMMM-YYYY')));
                    $('#availabledateendalarmscadaanomaly').html(kendo.toString(moment.utc(maxDatetemp).format('DD-MMMM-YYYY')));
                }
            }  
        });
    },
    RefreshGrid: function () {
        setTimeout(function () {
            $('#dataGrid').data('kendoGrid').refresh();
            $('#dataGridAlarm').data('kendoGrid').refresh();
            $('#dataGridExceptionTimeDuration').data('kendoGrid').refresh();
            $('#dataGridAnomalies').data('kendoGrid').refresh();
            $('#dataGridAlarmOverlapping').data('kendoGrid').refresh();
            $('#dataGridAlarmAnomalies').data('kendoGrid').refresh();

            $('#dataGridJMR').data('kendoGrid').refresh();
            $('#dataGridMet').data('kendoGrid').refresh();
        }, 200);
    },
    InitGrid: function () {
        var dateStart = $('#dateStart').data('kendoDatePicker').value();
        var dateEnd = $('#dateEnd').data('kendoDatePicker').value();
        var turbine = [];
        if ($("#turbineMulti").data("kendoMultiSelect").value().indexOf("All Turbine") >= 0) {
            turbine = turbineval;
        } else {
            turbine = $("#turbineMulti").data("kendoMultiSelect").value();
        }

        var param = {};

        $('#dataGrid').html("");
        $('#dataGrid').kendoGrid({
            dataSource: {
                filter: [
                    { field: "timestamp", operator: "gte", value: dateStart },
                    { field: "timestamp", operator: "lte", value: dateEnd },
                    { field: "isvalidtimeduration", operator: "eq", value: true },
                    { field: "turbine", operator: "in", value: turbine }
                ],
                serverPaging: true,
                serverSorting: true,
                serverFiltering: true,
                transport: {
                    read: {
                        url: viewModel.appName + "databrowser/getscadalist",
                        type: "POST",
                        data: param,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (options) {
                        return JSON.stringify(options);
                    }
                },
                pageSize: 10,
                schema: {
                    model: {
                        fields: {
                            AlarmOkTime: { type: "number" },
                            OkTime: { type: "number" },
                            Power: { type: "number" },
                            PowerLost: { type: "number" },
                        }
                    },
                    data: function (res) {
                        app.loading(false);
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data.Data
                    },
                    total: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        $('#totalpower').html(kendo.toString(res.data.TotalPower / 1000, 'n2') + ' MW');
                        $('#totalpowerlost').html(kendo.toString(res.data.TotalPowerLost / 1000, 'n2') + ' MW');
                        $('#totalturbine').html(kendo.toString(res.data.TotalTurbine, 'n0'));
                        $('#totaldata').html(kendo.toString(res.data.Total, 'n0'));
                        $('#totalprod').html(kendo.toString(res.data.TotalProduction/ 1000, 'n2') + ' MWh');
                        $('#avgwindspeed').html(kendo.toString(res.data.AvgWindSpeed, 'n2') + ' m/s');

                        //For Alarm
                        $('#totalprodalarm').html(kendo.toString(res.data.TotalProduction/ 1000, 'n2') + ' MWh');
                        $('#avgwindspeedalarm').html(kendo.toString(res.data.AvgWindSpeed, 'n2') + ' m/s');
                        return res.data.Total;
                    }
                },
                sort: [
                    { field: 'TimeStamp', dir: 'asc' },
                    { field: 'Turbine', dir: 'asc' }
                ],
            },
            selectable: "multiple",
            groupable: false,
            sortable: true,
            filterable: {
                extra: false,
                operators: {
                    string: {
                        eq: "Is equal to",
                        neq: "Is not equal to",
                        gt: "Is greater than",
                        gte: "Is greater than or equal to",
                        lt: "Is less than",
                        lte: "Is less than or equal to"
                    }
                }
            },
            filterMenuInit: function (e) {
                e.container.data("kendoPopup").bind("open", function () {
                    // console.log(e.container);
                    if (e.container.is(".k-grid-filter")) {
                        e.container.find("form").removeClass("k-state-border-up");
                        e.container.find("form").addClass("k-state-border-down");
                        // console.log(e.container[0]);
                    } else {
                        // console.log("test");
                    }


                });
            },
            pageable: true,
            //resizable: true,
            columns: [
                { title: "Date", field: "TimeStamp", template: "#= kendo.toString(moment.utc(TimeStamp).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", width: 80, locked: true, filterable: false },
                { title: "Turbine", field: "Turbine", attributes: { class: "align-center" }, width: 90, locked: true, filterable: false },
                { title: "Start Time", field: "TimeStamp", template: "#= kendo.toString(moment.utc(TimeStamp).format('HH:mm:ss'), 'HH:mm:ss') #", width: 65, locked: true, attributes: { style: "text-align:center;" }, filterable: false },
                { title: "Grid Frequency", field: "GridFrequency", width: 90, attributes: { class: "align-right" }, filterable: false },
                { title: "Reactive Power", field: "ReactivePower", width: 90, attributes: { class: "align-right" }, filterable: false },
                {
                    title: "Alarm",
                    headerAttributes: {
                        style: 'font-weight: bold; text-align: center;'
                    },
                    columns: [
                        { title: "Alarm Ext Stop Time", field: "AlarmExtStopTime", width: 90, attributes: { class: "align-right" }, filterable: false },
                        { title: "Alarm Grid Down Time", field: "AlarmGridDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm Inter Line Down", field: "AlaramInterLineDown", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm Mach Down Time", field: "AlarmMachDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm OK Time", field: "AlarmOkTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true, headerAttributes: { class: 'gridAlarmOkTime' } },
                        { title: "Alarm Unknown Time", field: "AlarmUnknownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm Weather Stop", field: "AlarmWeatherStop", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false }
                    ]
                },
                {
                    title: "Time",
                    headerAttributes: {
                        style: 'font-weight: bold; text-align: center;'
                    },
                    columns: [
                        { title: "Ext Stop Time", field: "ExternalStopTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Grid Down Time", field: "GridDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Grid OK Secs", field: "GridOkSecs", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Internal Line Down", field: "InternalLineDown", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Machine Down Time", field: "MachineDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "OK Secs", field: "OkSecs", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "OK Time", field: "OkTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true },
                        { title: "Unknown Time", field: "UnknownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false }
                    ]
                },
                { title: "Total Time", field: "TotalTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Generator RPM", field: "GeneratorRPM", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Nacelle Yaw Position Untwist", field: "NacelleYawPositionUntwist", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Nacelle Temperature", field: "NacelleTemperature", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Adj Wind Speed", field: "AdjWindSpeed", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Ambient Temperature", field: "AmbientTemperature", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Avg Blade Angle", field: "AvgBladeAngle", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Avg Wind Speed", field: "AvgWindSpeed", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Units Generated", field: "UnitsGenerated", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Estimated Power", field: "EstimatedPower", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Nacel Direction", field: "NacelDirection", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Power", field: "Power", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true },
                { title: "Power Lost", field: "PowerLost", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true, headerAttributes: { class: 'gridPowerLost' } },
                { title: "Rotor RPM", field: "RotorRPM", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Wind Direction", field: "WindDirection", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false }
            ]
        });

        var grid = $('#dataGrid').data('kendoGrid');
        var columns = grid.columns;
        dbr.gridColumnsScada([]);
        $.each(columns, function (i, val) {
            $('#dataGrid').data("kendoGrid").showColumn(val.field);
            var result = {
                field: val.field,
                title: val.title,
                value: true
            }
            dbr.gridColumnsScada.push(result);
        });
    },
    InitGridExceptionTimeDuration: function () {
        var dateStart = $('#dateStart').data('kendoDatePicker').value();
        var dateEnd = $('#dateEnd').data('kendoDatePicker').value();
        var turbine = [];
        if ($("#turbineMulti").data("kendoMultiSelect").value().indexOf("All Turbine") >= 0) {
            turbine = turbineval;
        } else {
            turbine = $("#turbineMulti").data("kendoMultiSelect").value();
        }

        var param = {};

        $('#dataGridExceptionTimeDuration').html("");
        $('#dataGridExceptionTimeDuration').kendoGrid({
            dataSource: {
                filter: [
                    { field: "timestamp", operator: "gte", value: dateStart },
                    { field: "timestamp", operator: "lte", value: dateEnd },
                    { field: "isvalidtimeduration", operator: "eq", value: false },
                    { field: "turbine", operator: "in", value: turbine }
                ],
                serverPaging: true,
                serverSorting: true,
                serverFiltering: true,
                transport: {
                    read: {
                        url: viewModel.appName + "databrowser/getscadalist",
                        type: "POST",
                        data: param,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (options) {
                        return JSON.stringify(options);
                    }
                },
                pageSize: 10,
                schema: {
                    model: {
                        fields: {
                            AlarmOkTime: { type: "number" },
                            OkTime: { type: "number" },
                            Power: { type: "number" },
                            PowerLost: { type: "number" },
                        }
                    },
                    data: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data.Data
                    },
                    total: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        $('#totalpowerExceptionTimeDuration').html(kendo.toString(res.data.TotalPower / 1000, 'n2') + ' MW');
                        $('#totalpowerlostExceptionTimeDuration').html(kendo.toString(res.data.TotalPowerLost / 1000, 'n2') + ' MW');
                        $('#totalturbineExceptionTimeDuration').html(kendo.toString(res.data.TotalTurbine, 'n0'));
                        $('#totaldataExceptionTimeDuration').html(kendo.toString(res.data.Total, 'n0'));

                        // $('#totprodExceptionTimeDuration').html(kendo.toString(res.data.totalProduction / 1000, 'n2') + ' MWh');
                        // $('#avgwindspeedExceptionTimeDuration').html(kendo.toString(res.data.avgWindSpeed, 'n2') + ' m/s');

                        $('#totprodExceptionTimeDuration').html(kendo.toString(res.data.TotalProduction/ 1000, 'n2') + ' MWh');
                        $('#avgwindspeedExceptionTimeDuration').html(kendo.toString(res.data.AvgWindSpeed, 'n2') + ' m/s');
                        return res.data.Total;
                    }
                },
                sort: [
                    { field: 'TimeStamp', dir: 'asc' },
                    { field: 'Turbine', dir: 'asc' }
                ],
            },
            selectable: "multiple",
            groupable: false,
            sortable: true,
            filterable: {
                extra: false,
                operators: {
                    string: {
                        eq: "Is equal to",
                        neq: "Is not equal to",
                        gt: "Is greater than",
                        gte: "Is greater than or equal to",
                        lt: "Is less than",
                        lte: "Is less than or equal to"
                    }
                }
            },
            pageable: true,
            //resizable: true,
            columns: [
                { title: "Date", field: "TimeStamp", template: "#= kendo.toString(moment.utc(TimeStamp).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", width: 80, locked: true, filterable: false },
                { title: "Turbine", field: "Turbine", attributes: { class: "align-center" }, width: 90, locked: true, filterable: false },
                { title: "Start Time", field: "TimeStamp", template: "#= kendo.toString(moment.utc(TimeStamp).format('HH:mm:ss'), 'HH:mm:ss') #", width: 65, locked: true, attributes: { style: "text-align:center;" }, filterable: false },
                { title: "Grid Frequency", field: "GridFrequency", width: 90, attributes: { class: "align-right" }, filterable: false },
                { title: "Reactive Power", field: "ReactivePower", width: 90, attributes: { class: "align-right" }, filterable: false },

                {
                    title: "Alarm",
                    headerAttributes: {
                        style: 'font-weight: bold; text-align: center;'
                    },
                    columns: [
                        { title: "Alarm Ext Stop Time", field: "AlarmExtStopTime", width: 90, attributes: { class: "align-right" }, filterable: false },
                        { title: "Alarm Grid Down Time", field: "AlarmGridDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm Inter Line Down", field: "AlaramInterLineDown", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm Mach Down Time", field: "AlarmMachDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm OK Time", field: "AlarmOkTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true, headerAttributes: { class: 'gridAlarmOkTime' } },
                        { title: "Alarm Unknown Time", field: "AlarmUnknownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm Weather Stop", field: "AlarmWeatherStop", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false }
                    ]
                },

                {
                    title: "Time",
                    headerAttributes: {
                        style: 'font-weight: bold; text-align: center;'
                    },
                    columns: [
                        { title: "Ext Stop Time", field: "ExternalStopTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Grid Down Time", field: "GridDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Grid OK Secs", field: "GridOkSecs", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Internal Line Down", field: "InternalLineDown", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Machine Down Time", field: "MachineDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "OK Secs", field: "OkSecs", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "OK Time", field: "OkTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true },
                        { title: "Unknown Time", field: "UnknownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false }
                    ]
                },
                { title: "Total Time", field: "TotalTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Generator RPM", field: "GeneratorRPM", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Nacelle Yaw Position Untwist", field: "NacelleYawPositionUntwist", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Nacelle Temperature", field: "NacelleTemperature", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Adj Wind Speed", field: "AdjWindSpeed", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Ambient Temperature", field: "AmbientTemperature", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Avg Blade Angle", field: "AvgBladeAngle", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Avg Wind Speed", field: "AvgWindSpeed", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Units Generated", field: "UnitsGenerated", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Estimated Power", field: "EstimatedPower", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Nacel Direction", field: "NacelDirection", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Power", field: "Power", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true },
                { title: "Power Lost", field: "PowerLost", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true, headerAttributes: { class: 'gridPowerLost' } },
                { title: "Rotor RPM", field: "RotorRPM", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Wind Direction", field: "WindDirection", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false }
            ]
        });
        var grid = $('#dataGridExceptionTimeDuration').data('kendoGrid');
        var columns = grid.columns;
        dbr.gridColumnsScadaException([]);
        $.each(columns, function (i, val) {
            $('#dataGridExceptionTimeDuration').data("kendoGrid").showColumn(val.field);
            var result = {
                field: val.field,
                title: val.title,
                value: true
            }
            dbr.gridColumnsScadaException.push(result);
        });
    },
    InitGridAnomalies: function () {
        var dateStart = $('#dateStart').data('kendoDatePicker').value();
        var dateEnd = $('#dateEnd').data('kendoDatePicker').value();
        var turbine = [];
        if ($("#turbineMulti").data("kendoMultiSelect").value().indexOf("All Turbine") >= 0) {
            turbine = turbineval;
        } else {
            turbine = $("#turbineMulti").data("kendoMultiSelect").value();
        }

        var param = {};

        $('#dataGridAnomalies').html("");
        $('#dataGridAnomalies').kendoGrid({
            selectable: "multiple",
            dataSource: {
                filter: [
                    { field: "timestamp", operator: "gte", value: dateStart },
                    { field: "timestamp", operator: "lte", value: dateEnd },
                    { field: "isvalidtimeduration", operator: "eq", value: true },
                    { field: "turbine", operator: "in", value: turbine }
                ],
                serverPaging: true,
                serverSorting: true,
                serverFiltering: true,
                transport: {
                    read: {
                        url: viewModel.appName + "databrowser/getscadaanomalylist",
                        type: "POST",
                        data: param,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (options) {
                        return JSON.stringify(options);
                    }
                },
                pageSize: 10,
                schema: {
                    model: {
                        fields: {
                            AlarmOkTime: { type: "number" },
                            OkTime: { type: "number" },
                            Power: { type: "number" },
                            PowerLost: { type: "number" },
                        }
                    },
                    data: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data.Data
                    },
                    total: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        $('#totalpowerAnomalies').html(kendo.toString(res.data.TotalPower / 1000, 'n2') + ' MW');
                        $('#totalpowerlostAnomalies').html(kendo.toString(res.data.TotalPowerLost / 1000, 'n2') + ' MW');
                        $('#totalturbineAnomalies').html(kendo.toString(res.data.TotalTurbine, 'n0'));
                        $('#totaldataAnomalies').html(kendo.toString(res.data.Total, 'n0'));

                        $('#totprodAnomalies').html(kendo.toString(res.data.TotalProduction / 1000, 'n2') + ' MWh');
                        $('#avgwindspeedAnomalies').html(kendo.toString(res.data.AvgWindSpeed, 'n2') + ' m/s');
                        return res.data.Total;
                    }
                },
                sort: [
                    { field: 'TimeStamp', dir: 'asc' },
                    { field: 'Turbine', dir: 'asc' }
                ],
            },
            groupable: false,
            sortable: true,
            filterable: {
                extra: false,
                operators: {
                    string: {
                        eq: "Is equal to",
                        neq: "Is not equal to",
                        gt: "Is greater than",
                        gte: "Is greater than or equal to",
                        lt: "Is less than",
                        lte: "Is less than or equal to"
                    }
                }
            },
            pageable: true,
            resizable: true,
            columns: [
                { title: "Date", field: "TimeStamp", template: "#= kendo.toString(moment.utc(TimeStamp).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", width: 80, locked: true, filterable: false },
                { title: "Turbine", field: "Turbine", attributes: { class: "align-center" }, width: 90, locked: true, filterable: false },
                { title: "Start Time", field: "TimeStamp", template: "#= kendo.toString(moment.utc(TimeStamp).format('HH:mm:ss'), 'HH:mm:ss') #", width: 65, locked: true, attributes: { style: "text-align:center;" }, filterable: false },
                { title: "Grid Frequency", field: "GridFrequency", width: 90, attributes: { class: "align-right" }, filterable: false },
                { title: "Reactive Power", field: "ReactivePower", width: 90, attributes: { class: "align-right" }, filterable: false },

                {
                    title: "Alarm",
                    headerAttributes: {
                        style: 'font-weight: bold; text-align: center;'
                    },
                    columns: [
                        { title: "Alarm Ext Stop Time", field: "AlarmExtStopTime", width: 90, attributes: { class: "align-right" }, filterable: false },
                        { title: "Alarm Grid Down Time", field: "AlarmGridDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm Inter Line Down", field: "AlaramInterLineDown", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm Mach Down Time", field: "AlarmMachDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm OK Time", field: "AlarmOkTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true, headerAttributes: { class: 'gridAlarmOkTime' } },
                        { title: "Alarm Unknown Time", field: "AlarmUnknownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Alarm Weather Stop", field: "AlarmWeatherStop", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false }
                    ]
                },

                {
                    title: "Time",
                    headerAttributes: {
                        style: 'font-weight: bold; text-align: center;'
                    },
                    columns: [
                        { title: "Ext Stop Time", field: "ExternalStopTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Grid Down Time", field: "GridDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Grid OK Secs", field: "GridOkSecs", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Internal Line Down", field: "InternalLineDown", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "Machine Down Time", field: "MachineDownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "OK Secs", field: "OkSecs", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                        { title: "OK Time", field: "OkTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true },
                        { title: "Unknown Time", field: "UnknownTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false }
                    ]
                },
                { title: "Total Time", field: "TotalTime", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Generator RPM", field: "GeneratorRPM", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Nacelle Yaw Position Untwist", field: "NacelleYawPositionUntwist", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Nacelle Temperature", field: "NacelleTemperature", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Adj Wind Speed", field: "AdjWindSpeed", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Ambient Temperature", field: "AmbientTemperature", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Avg Blade Angle", field: "AvgBladeAngle", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Avg Wind Speed", field: "AvgWindSpeed", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Units Generated", field: "UnitsGenerated", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Estimated Power", field: "EstimatedPower", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Nacel Direction", field: "NacelDirection", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Power", field: "Power", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true },
                { title: "Power Lost", field: "PowerLost", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: true, headerAttributes: { class: 'gridPowerLost' } },
                { title: "Rotor RPM", field: "RotorRPM", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false },
                { title: "Wind Direction", field: "WindDirection", width: 90, attributes: { class: "align-right" }, format: "{0:n2}", filterable: false }
            ]
        });
        var grid = $('#dataGridAnomalies').data('kendoGrid');
        var columns = grid.columns;
        dbr.gridColumnsScadaAnomaly([]);
        $.each(columns, function (i, val) {
            $('#dataGridAnomalies').data("kendoGrid").showColumn(val.field);
            var result = {
                field: val.field,
                title: val.title,
                value: true
            }
            dbr.gridColumnsScadaAnomaly.push(result);
        });
    },
    InitGridAlarm: function () {
        var dateStart = $('#dateStart').data('kendoDatePicker').value();
        var dateEnd = $('#dateEnd').data('kendoDatePicker').value();
        var turbine = [];
        if ($("#turbineMulti").data("kendoMultiSelect").value().indexOf("All Turbine") >= 0) {
            turbine = turbineval;
        } else {
            turbine = $("#turbineMulti").data("kendoMultiSelect").value();
        }

        var filters = [
            { field: "startdate", operator: "gte", value: dateStart },
            { field: "startdate", operator: "lte", value: dateEnd },
            { field: "turbine", operator: "in", value: turbine },
        ];
        var filter = { filters: filters }
        var param = { filter: filter };

        $('#dataGridAlarm').html("");
        $('#dataGridAlarm').kendoGrid({
            selectable: "multiple",
            dataSource: {
                serverPaging: true,
                serverSorting: true,
                transport: {
                    read: {
                        url: viewModel.appName + "databrowser/getalarmlist",
                        type: "POST",
                        data: param,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (options) {
                        return JSON.stringify(options);
                    }
                },
                pageSize: 10,
                schema: {
                    data: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data.Data
                    },
                    total: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        $('#totalturbinealarm').html(kendo.toString(res.data.TotalTurbine, 'n0'));
                        $('#totaldataalarm').html(kendo.toString(res.data.Total, 'n0'));
                        return res.data.Total;
                    }
                },
                sort: [
                    { field: 'StartDate', dir: 'asc' },
                    { field: 'Turbine', dir: 'asc' }
                ],
            },
            groupable: false,
            sortable: true,
            filterable: false,
            pageable: true,
            //resizable: true,
            columns: [
                { title: "Date", field: "StartDate", template: "#= kendo.toString(moment.utc(StartDate).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", width: 80 },
                { title: "Turbine", field: "Turbine", width: 90, attributes: { style: "text-align:center;" } },
                { title: "Start Time", field: "StartDate", template: "#= kendo.toString(moment.utc(StartDate).format('HH:mm:ss'), 'HH:mm:ss') #", width: 75, attributes: { style: "text-align:center;" } },
                /*{ title: "Farm", field: "Farm", width: 100 },*/
                { title: "End Date", field: "EndDate", template: "#= kendo.toString(moment.utc(EndDate).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", width: 80 },
                { title: "End Time", field: "EndDate", template: "#= kendo.toString(moment.utc(EndDate).format('HH:mm:ss'), 'HH:mm:ss') #", width: 70, attributes: { style: "text-align:center;" } },
                { title: "Alert Description", field: "AlertDescription", width: 200 },
                { title: "External Stop", field: "ExternalStop", width: 80, sortable: false, template: '# if (ExternalStop == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Grid Down", field: "GridDown", width: 80, sortable: false, template: '# if (GridDown == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Internal Grid", field: "InternalGrid", width: 80, sortable: false, template: '# if (InternalGrid == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Machine Down", field: "MachineDown", width: 80, sortable: false, template: '# if (MachineDown == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "AEbOK", field: "AEbOK", width: 80, sortable: false, template: '# if (AEbOK == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Unknown", field: "Unknown", width: 80, sortable: false, template: '# if (Unknown == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Weather Stop", field: "WeatherStop", width: 80, sortable: false, template: '# if (WeatherStop == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
            ]
        });


    },
    InitGridAlarmAnomalies: function () {
        var dateStart = $('#dateStart').data('kendoDatePicker').value();
        var dateEnd = $('#dateEnd').data('kendoDatePicker').value();
        var turbine = [];
        if ($("#turbineMulti").data("kendoMultiSelect").value().indexOf("All Turbine") >= 0) {
            turbine = turbineval;
        } else {
            turbine = $("#turbineMulti").data("kendoMultiSelect").value();
        }

        var filters = [
            { field: "startdate", operator: "gte", value: dateStart },
            { field: "startdate", operator: "lte", value: dateEnd },
            { field: "turbine", operator: "in", value: turbine },
        ];
        var filter = { filters: filters }
        var param = { filter: filter };

        $('#dataGridAlarmAnomalies').html("");
        $('#dataGridAlarmAnomalies').kendoGrid({
            selectable: "multiple",
            dataSource: {
                serverPaging: true,
                serverSorting: true,
                transport: {
                    read: {
                        url: viewModel.appName + "databrowser/getalarmscadaanomalylist",
                        type: "POST",
                        data: param,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (options) {
                        return JSON.stringify(options);
                    }
                },
                pageSize: 10,
                schema: {
                    data: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data.Data
                    },
                    total: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        $('#totalturbinealarmAnomalies').html(kendo.toString(res.data.TotalTurbine, 'n0'));
                        $('#totaldataalarmAnomalies').html(kendo.toString(res.data.Total, 'n0'));
                        return res.data.Total;
                    }
                },
                sort: [
                    { field: 'StartDate', dir: 'asc' },
                    { field: 'Turbine', dir: 'asc' }
                ],
            },
            groupable: false,
            sortable: true,
            filterable: false,
            pageable: true,
            resizable: true,
            columns: [
                { title: "Date", field: "StartDate", template: "#= kendo.toString(moment.utc(StartDate).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", width: 80 },
                { title: "Turbine", field: "Turbine", width: 90, attributes: { style: "text-align:center;" } },
                { title: "Start Time", field: "StartDate", template: "#= kendo.toString(moment.utc(StartDate).format('HH:mm:ss'), 'HH:mm:ss') #", width: 75, attributes: { style: "text-align:center;" } },
                /*{ title: "Farm", field: "Farm", width: 100 },*/
                { title: "End Date", field: "EndDate", template: "#= kendo.toString(moment.utc(EndDate).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", width: 80 },
                { title: "End Time", field: "EndDate", template: "#= kendo.toString(moment.utc(EndDate).format('HH:mm:ss'), 'HH:mm:ss') #", width: 70, attributes: { style: "text-align:center;" } },
                { title: "Alert Description", field: "AlertDescription", width: 200 },
                { title: "External Stop", field: "ExternalStop", width: 80, sortable: false, template: '# if (ExternalStop == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Grid Down", field: "GridDown", width: 80, sortable: false, template: '# if (GridDown == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Internal Grid", field: "InternalGrid", width: 80, sortable: false, template: '# if (InternalGrid == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Machine Down", field: "MachineDown", width: 80, sortable: false, template: '# if (MachineDown == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "AEbOK", field: "AEbOK", width: 80, sortable: false, template: '# if (AEbOK == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Unknown", field: "Unknown", width: 80, sortable: false, template: '# if (Unknown == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Weather Stop", field: "WeatherStop", width: 80, sortable: false, template: '# if (WeatherStop == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Alarm Ok Time", field: "IsAlarmOk", width: 80, sortable: false, template: '# if (IsAlarmOk == true ) { # <span class="glyphicon glyphicon-ok"></span> # } else {# <span class="glyphicon glyphicon-remove"></span> #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
            ]
        });
    },
    InitOverlapDetail: function (e) {
        var dateStart = $('#dateStart').data('kendoDatePicker').value();
        var dateEnd = $('#dateEnd').data('kendoDatePicker').value();
        var turbine = [];
        if ($("#turbineMulti").data("kendoMultiSelect").value().indexOf("All Turbine") >= 0) {
            turbine = turbineval;
        } else {
            turbine = $("#turbineMulti").data("kendoMultiSelect").value();
        }
        var param = {};

        $("<div/>").appendTo(e.detailCell).kendoGrid({
            selectable: "multiple",
            dataSource: {
                serverPaging: false,
                serverSorting: false,
                serverFiltering: true,
                filter: [
                    { field: "_id", operator: "eq", value: e.data.ID },
                    { field: "startdate", operator: "gte", value: dateStart },
                    { field: "startdate", operator: "lte", value: dateEnd },
                    { field: "turbine", operator: "in", value: turbine }
                ],
                transport: {
                    read: {
                        url: viewModel.appName + "databrowser/getalarmoverlappingdetails",
                        type: "POST",
                        data: param,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (options) {
                        return JSON.stringify(options);
                    }
                },
                schema: {
                    data: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data.Data
                    },
                    total: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data.Total;
                    }
                },
                sort: [
                    { field: 'StartDate', dir: 'asc' },
                    { field: 'Turbine', dir: 'asc' }
                ],
            },
            scrollable: true,
            sortable: false,
            pageable: false,
            //resizable: true,
            columns: [
                { title: "Date", field: "StartDate", template: "#= kendo.toString(moment.utc(StartDate).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", headerAttributes: { style: "text-align: center" }, width: 80 },
                { title: "Turbine", field: "Turbine", width: 90, sortable: false, headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Start Time", field: "StartDate", template: "#= kendo.toString(moment.utc(StartDate).format('HH:mm:ss'), 'HH:mm:ss') #", width: 65, sortable: false, headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                /*{ title: "Farm", field: "Farm", width: 100 },*/
                { title: "End Date", field: "EndDate", template: "#= kendo.toString(moment.utc(EndDate).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", headerAttributes: { style: "text-align: center" }, width: 80, sortable: false },
                { title: "End Time", field: "EndDate", template: "#= kendo.toString(moment.utc(EndDate).format('HH:mm:ss'), 'HH:mm:ss') #", width: 65, headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" }, sortable: false },
                { title: "Alert Description", field: "AlertDescription", width: 200, headerAttributes: { style: "text-align: center" }, sortable: false },
                // { title: "External Stop", field: "ExternalStop", width: 90 , sortable: false, template:"<img src='../res/img/green-dot.png'>", attributes:{style:"text-align:center;"}},
                { title: "External Stop", field: "ExternalStop", width: 80, sortable: false, template: '# if (ExternalStop == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Grid Down", field: "GridDown", width: 80, sortable: false, template: '# if (GridDown == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Internal Grid", field: "InternalGrid", width: 80, sortable: false, template: '# if (InternalGrid == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Machine Down", field: "MachineDown", width: 80, sortable: false, template: '# if (MachineDown == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "AEbOK", field: "AEbOK", width: 80, sortable: false, template: '# if (AEbOK == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "Unknown", field: "Unknown", width: 80, sortable: false, template: '# if (Unknown == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
                { title: "WeatherStop", field: "WeatherStop", width: 80, sortable: false, template: '# if (WeatherStop == true ) { # <img src="../res/img/red-dot.png" /> # } else {# #}#', headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align:center;" } },
            ]
        });
    },
    InitGridAlarmOverlapping: function () {
        var dateStart = $('#dateStart').data('kendoDatePicker').value();
        var dateEnd = $('#dateEnd').data('kendoDatePicker').value();
        var turbine = [];
        if ($("#turbineMulti").data("kendoMultiSelect").value().indexOf("All Turbine") >= 0) {
            turbine = turbineval;
        } else {
            turbine = $("#turbineMulti").data("kendoMultiSelect").value();
        }

        var filters = [
            { field: "startdate", operator: "gte", value: dateStart },
            { field: "startdate", operator: "lte", value: dateEnd },
            { field: "turbine", operator: "in", value: turbine },
        ];
        var filter = { filters: filters }
        var param = { filter: filter };

        $('#dataGridAlarmOverlapping').html("");
        $('#dataGridAlarmOverlapping').kendoGrid({
            dataSource: {
                serverPaging: true,
                serverSorting: true,
                transport: {
                    read: {
                        url: viewModel.appName + "databrowser/getalarmoverlappinglist",
                        type: "POST",
                        data: param,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (options) {
                        return JSON.stringify(options);
                    }
                },
                pageSize: 10,
                schema: {
                    data: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data.Data
                    },
                    total: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        $('#totalturbinealarmo').html(kendo.toString(res.data.TotalTurbine, 'n0'));
                        $('#totaldataalarmo').html(kendo.toString(res.data.Total, 'n0'));
                        return res.data.Total;
                    }
                },
                sort: [
                    { field: 'StartDate', dir: 'asc' },
                    { field: 'Turbine', dir: 'asc' }
                ],
            },
            groupable: false,
            sortable: true,
            filterable: false,
            pageable: true,
            detailInit: Data.InitOverlapDetail,
            columns: [
                { title: "Date", field: "StartDate", template: "#= kendo.toString(moment.utc(StartDate).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", width: 80 },
                { title: "Turbine", field: "Turbine", width: 90 },
                { title: "Start Time", field: "StartDate", template: "#= kendo.toString(moment.utc(StartDate).format('HH:mm:ss'), 'HH:mm:ss') #", width: 75, attributes: { style: "text-align:center;" } },
                /*{ title: "Farm", field: "Farm", width: 100 },*/
                { title: "End Date", field: "EndDate", template: "#= kendo.toString(moment.utc(EndDate).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #", width: 80 },
                { title: "End Time", field: "EndDate", template: "#= kendo.toString(moment.utc(EndDate).format('HH:mm:ss'), 'HH:mm:ss') #", width: 75, attributes: { style: "text-align:center;" } },
            ]
        });
    },
    InitGridJMR: function () {
        var turbine = [];
        if ($("#turbineMulti").data("kendoMultiSelect").value().indexOf("All Turbine") >= 0) {
            turbine = turbineval;
        } else {
            turbine = $("#turbineMulti").data("kendoMultiSelect").value();
        }

        var dateStart = kendo.toString($('#dateStart').data('kendoDatePicker').value(), "yyyyMM");
        var dateEnd = kendo.toString($('#dateEnd').data('kendoDatePicker').value(), "yyyyMM");

        var monthId = [];

        if (dateStart != dateEnd) {
            var dateStartInt = parseInt(dateStart);
            var dateEndInt = parseInt(dateEnd);
            var dsYear = parseInt(dateStart.substring(0, 4));
            var dsMonth = parseInt(dateStart.substring(4, 6));
            var deYear = parseInt(dateEnd.substring(0, 4));
            var deMonth = parseInt(dateEnd.substring(4, 6));
            var exit = false;

            monthId.push(dateStartInt);

            do {
                if (dateStartInt < dateEndInt) {
                    if (dsMonth < 12) {
                        dsMonth++;
                    } else {
                        dsYear++;
                        dsMonth = 1;
                    }

                    if (dsMonth > 9) {
                        dateStartInt = parseInt(dsYear + "" + dsMonth)
                    } else {
                        dateStartInt = parseInt(dsYear + "0" + dsMonth)
                    }

                    monthId.push(dateStartInt);
                } else {
                    exit = true;
                }
            } while (exit == false);
        } else {
            monthId.push(parseInt(dateStart));
        }

        var filters = [
            { field: "dateinfo.monthid", operator: "in", value: monthId },
            { field: "sections.turbine", operator: "in", value: turbine },
        ];

        dbr.filterJMR(filters);

        var filter = { filters: filters }
        var param = { filter: filter };

        $('#dataGridJMR').html("");
        $('#dataGridJMR').kendoGrid({
            dataSource: {
                serverPaging: true,
                serverSorting: true,
                transport: {
                    read: {
                        url: viewModel.appName + "databrowser/getjmrlist",
                        type: "POST",
                        data: param,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (options) {
                        return JSON.stringify(options);
                    }
                },
                pageSize: 10,
                schema: {
                    data: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data.Data
                    },
                    total: function (res) {
                        // console.log(res);
                        if (!app.isFine(res)) {
                            return;
                        }
                        $('#totaldatajmr').html(kendo.toString(res.data.Total, 'n0'));
                        return res.data.Total;
                    }
                },
                sort: [
						{ field: 'DateInfo.DateId', dir: 'asc' },
						// { field: 'Turbine', dir: 'asc' }
					],
            },
            groupable: false,
            sortable: true,
            filterable: false,
            pageable: true,
            detailInit: Data.InitJMRDetail,
            columns: [
                // { title: "Month", field: "DateInfo.MonthDesc", width: 150, attributes: { style: "text-align:center;" } },
                 { title: "Month", field: "DateInfo.DateId", attributes: { style: "text-align: center" }, template: "#= kendo.toString(moment.utc(DateInfo.DateId).format('MMMM YYYY'), 'dd-MMM-yyyy') #" },
                { title: "Description", field: "Description" },
                // { title: "", field: "DateInfo.MonthId", hidden: true}
            ]
        });
    },
    InitJMRDetail: function (e) {
        var turbine = [];
        if ($("#turbineMulti").data("kendoMultiSelect").value().indexOf("All Turbine") >= 0) {
            turbine = turbineval;
        } else {
            turbine = $("#turbineMulti").data("kendoMultiSelect").value();
        }

        var filters = [
            { field: "dateinfo.monthid", operator: "in", value: [e.data.DateInfo.MonthId] },
            { field: "sections.turbine", operator: "in", value: turbine },
        ];

        var param = {};

        $("<div/>").appendTo(e.detailCell).kendoGrid({
            selectable: "multiple",
            dataSource: {
                serverPaging: false,
                serverSorting: false,
                serverFiltering: true,
                filter: filters,
                transport: {
                    read: {
                        url: viewModel.appName + "databrowser/getjmrdetails",
                        type: "POST",
                        data: param,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (options) {
                        return JSON.stringify(options);
                    }
                },
                schema: {
                    model: {
                        fields: {
                            ContrGen: { type: "number" },

                            BoEExport: { type: "number" },
                            BoEImport: { type: "number" },
                            BoENet: { type: "number" },

                            BoLExport: { type: "number" },
                            BoLImport: { type: "number" },
                            BoLNet: { type: "number" },

                            BoE2Export: { type: "number" },
                            BoE2Import: { type: "number" },
                            BoE2Net: { type: "number" },
                        }
                    },
                    data: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data
                    }
                },
            },
            scrollable: true,
            sortable: false,
            pageable: false,
            columns: [
                { title: "Description", field: "Description", width: 130, headerAttributes: { style: "text-align: center" }, sortable: false },
                { title: "Turbine", field: "Turbine", width: 70, headerAttributes: { style: "text-align: center" }, attributes: { style: "text-align: center" }, sortable: false },
                { title: "Company", field: "Company", width: 150, headerAttributes: { style: "text-align: center" }, sortable: false },
                { title: "Controller Gen.", field: "ContrGen", format: "{0:n2}", width: 100, attributes: { style: "text-align: center" }, sortable: false, headerAttributes: { style: "text-align: center" } },
                {
                    title: "Break of Energy",
                    headerAttributes: { style: 'font-weight: bold; text-align: center;' },
                    columns: [
                        { title: "KWh Export", field: "BoEExport", format: "{0:n2}", width: 100, attributes: { style: "text-align: center" }, sortable: false, headerAttributes: { style: "text-align: center" } },
                        { title: "KWh Import", field: "BoEImport", format: "{0:n2}", width: 100, attributes: { style: "text-align: center" }, sortable: false, headerAttributes: { style: "text-align: center" } },
                        { title: "KWh Net", field: "BoENet", format: "{0:n2}", width: 100, attributes: { style: "text-align: center" }, sortable: false, headerAttributes: { style: "text-align: center" } },
                    ]
                },
                {
                    title: "Break of Losses",
                    headerAttributes: { style: 'font-weight: bold; text-align: center;' },
                    columns: [
                        { title: "KWh Export", field: "BoLExport", format: "{0:n2}", width: 100, attributes: { style: "text-align: center" }, sortable: false, headerAttributes: { style: "text-align: center" }, template: "#if(BoLExport==0){#  #}else {# #: kendo.toString(BoLExport, 'n2') # #}#" },
                        { title: "KWh Import", field: "BoLImport", format: "{0:n2}", width: 100, attributes: { style: "text-align: center" }, sortable: false, headerAttributes: { style: "text-align: center" }, template: "#if(BoLImport==0){#  #}else {# #: kendo.toString(BoLImport, 'n2') # #}#" },
                        { title: "KWh Net", field: "BoLNet", format: "{0:n2}", width: 100, attributes: { style: "text-align: center" }, sortable: false, headerAttributes: { style: "text-align: center" }, template: "#if(BoLImport==0){#  #}else {# #: kendo.toString(BoLImport, 'n2') # #}#" },
                    ]
                },
                {
                    title: "Break of Energy",
                    headerAttributes: { style: 'font-weight: bold; text-align: center;' },
                    columns: [
                        { title: "KWh Export", field: "BoE2Export", format: "{0:n2}", width: 100, attributes: { style: "text-align: center" }, sortable: false, headerAttributes: { style: "text-align: center" }, template: "#if(BoE2Export==0){#  #}else {# #: kendo.toString(BoE2Export, 'n2') # #}#" },
                        { title: "KWh Import", field: "BoE2Import", format: "{0:n2}", width: 100, attributes: { style: "text-align: center" }, sortable: false, headerAttributes: { style: "text-align: center" }, template: "#if(BoE2Import==0){#  #}else {# #: kendo.toString(BoE2Import, 'n2') # #}#" },
                        { title: "KWh Net", field: "BoE2Net", format: "{0:n2}", width: 100, attributes: { style: "text-align: center" }, sortable: false, headerAttributes: { style: "text-align: center" }, template: "#if(BoE2Import==0){#  #}else {# #: kendo.toString(BoE2Import, 'n2') # #}#" },
                    ]
                },
            ]
        });
    },
    InitMet: function () {
        var dateStart = $('#dateStart').data('kendoDatePicker').value();
        var dateEnd = $('#dateEnd').data('kendoDatePicker').value();
        var param = {};

        $('#dataGridMet').html("");
        $('#dataGridMet').kendoGrid({
            dataSource: {
                filter: [
                    { field: "timestamp", operator: "gte", value: dateStart },
                    { field: "timestamp", operator: "lte", value: dateEnd }
                ],
                serverPaging: true,
                serverSorting: true,
                serverFiltering: true,
                transport: {
                    read: {
                        url: viewModel.appName + "databrowser/getmetlist",
                        type: "POST",
                        data: param,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (options) {
                        return JSON.stringify(options);
                    }
                },
                pageSize: 10,
                schema: {
                    model: {
                        fields: {
                            VHubWS90mAvg: { type: "number" },
                            VHubWS90mMax: { type: "number" },
                            VHubWS90mMin: { type: "number" },
                            VHubWS90mStdDev: { type: "number" },
                            VHubWS90mCount: { type: "number" },

                            VRefWS88mAvg: { type: "number" },
                            VRefWS88mMax: { type: "number" },
                            VRefWS88mMin: { type: "number" },
                            VRefWS88mStdDev: { type: "number" },
                            VRefWS88mCount: { type: "number" },

                            VTipWS42mAvg: { type: "number" },
                            VTipWS42mMax: { type: "number" },
                            VTipWS42mMin: { type: "number" },
                            VTipWS42mStdDev: { type: "number" },
                            VTipWS42mCount: { type: "number" },

                            DHubWD88mAvg: { type: "number" },
                            DHubWD88mMax: { type: "number" },
                            DHubWD88mMin: { type: "number" },
                            DHubWD88mStdDev: { type: "number" },
                            DHubWD88mCount: { type: "number" },

                            DRefWD86mAvg: { type: "number" },
                            DRefWD86mMax: { type: "number" },
                            DRefWD86mMin: { type: "number" },
                            DRefWD86mStdDev: { type: "number" },
                            DRefWD86mCount: { type: "number" },

                            THubHHubHumid855mAvg: { type: "number" },
                            THubHHubHumid855mMax: { type: "number" },
                            THubHHubHumid855mMin: { type: "number" },
                            THubHHubHumid855mStdDev: { type: "number" },
                            THubHHubHumid855mCount: { type: "number" },

                            TRefHRefHumid855mAvg: { type: "number" },
                            TRefHRefHumid855mMax: { type: "number" },
                            TRefHRefHumid855mMin: { type: "number" },
                            TRefHRefHumid855mStdDev: { type: "number" },
                            TRefHRefHumid855mCount: { type: "number" },

                            THubHHubTemp855mAvg: { type: "number" },
                            THubHHubTemp855mMax: { type: "number" },
                            THubHHubTemp855mMin: { type: "number" },
                            THubHHubTemp855mStdDev: { type: "number" },
                            THubHHubTemp855mCount: { type: "number" },

                            TRefHRefTemp855mAvg: { type: "number" },
                            TRefHRefTemp855mMax: { type: "number" },
                            TRefHRefTemp855mMin: { type: "number" },
                            TRefHRefTemp855mStdDev: { type: "number" },
                            TRefHRefTemp855mCount: { type: "number" },

                            BaroAirPress855mAvg: { type: "number" },
                            BaroAirPress855mMax: { type: "number" },
                            BaroAirPress855mMin: { type: "number" },
                            BaroAirPress855mStdDev: { type: "number" },
                            BaroAirPress855mCount: { type: "number" },

                            YawAngleVoltageAvg: { type: "number" },
                            YawAngleVoltageMax: { type: "number" },
                            YawAngleVoltageMin: { type: "number" },
                            YawAngleVoltageStdDev: { type: "number" },
                            YawAngleVoltageCount: { type: "number" },
                            OtherSensorVoltageAI1Avg: { type: "number" },
                            OtherSensorVoltageAI1Max: { type: "number" },
                            OtherSensorVoltageAI1Min: { type: "number" },
                            OtherSensorVoltageAI1StdDev: { type: "number" },
                            OtherSensorVoltageAI1Count: { type: "number" },
                            OtherSensorVoltageAI2Avg: { type: "number" },
                            OtherSensorVoltageAI2Max: { type: "number" },
                            OtherSensorVoltageAI2Min: { type: "number" },
                            OtherSensorVoltageAI2StdDev: { type: "number" },
                            OtherSensorVoltageAI2Count: { type: "number" },
                            OtherSensorVoltageAI3Avg: { type: "number" },
                            OtherSensorVoltageAI3Max: { type: "number" },
                            OtherSensorVoltageAI3Min: { type: "number" },
                            OtherSensorVoltageAI3StdDev: { type: "number" },
                            OtherSensorVoltageAI3Count: { type: "number" },
                            OtherSensorVoltageAI4Avg: { type: "number" },
                            OtherSensorVoltageAI4Max: { type: "number" },
                            OtherSensorVoltageAI4Min: { type: "number" },
                            OtherSensorVoltageAI4StdDev: { type: "number" },
                            OtherSensorVoltageAI4Count: { type: "number" },
                            GenRPMCurrentAvg: { type: "number" },
                            GenRPMCurrentMax: { type: "number" },
                            GenRPMCurrentMin: { type: "number" },
                            GenRPMCurrentStdDev: { type: "number" },
                            GenRPMCurrentCount: { type: "number" },
                            WS_SCSCurrentAvg: { type: "number" },
                            WS_SCSCurrentMax: { type: "number" },
                            WS_SCSCurrentMin: { type: "number" },
                            WS_SCSCurrentStdDev: { type: "number" },
                            WS_SCSCurrentCount: { type: "number" },
                            RainStatusCount: { type: "number" },
                            RainStatusSum: { type: "number" },
                            OtherSensor2StatusIO1Avg: { type: "number" },
                            OtherSensor2StatusIO1Max: { type: "number" },
                            OtherSensor2StatusIO1Min: { type: "number" },
                            OtherSensor2StatusIO1StdDev: { type: "number" },
                            OtherSensor2StatusIO1Count: { type: "number" },
                            OtherSensor2StatusIO2Avg: { type: "number" },
                            OtherSensor2StatusIO2Max: { type: "number" },
                            OtherSensor2StatusIO2Min: { type: "number" },
                            OtherSensor2StatusIO2StdDev: { type: "number" },
                            OtherSensor2StatusIO2Count: { type: "number" },
                            OtherSensor2StatusIO3Avg: { type: "number" },
                            OtherSensor2StatusIO3Max: { type: "number" },
                            OtherSensor2StatusIO3Min: { type: "number" },
                            OtherSensor2StatusIO3StdDev: { type: "number" },
                            OtherSensor2StatusIO3Count: { type: "number" },
                            OtherSensor2StatusIO4Avg: { type: "number" },
                            OtherSensor2StatusIO4Max: { type: "number" },
                            OtherSensor2StatusIO4Min: { type: "number" },
                            OtherSensor2StatusIO4StdDev: { type: "number" },
                            OtherSensor2StatusIO4Count: { type: "number" },
                            OtherSensor2StatusIO5Avg: { type: "number" },
                            OtherSensor2StatusIO5Max: { type: "number" },
                            OtherSensor2StatusIO5Min: { type: "number" },
                            OtherSensor2StatusIO5StdDev: { type: "number" },
                            OtherSensor2StatusIO5Count: { type: "number" },
                            A1Avg: { type: "number" },
                            A1Max: { type: "number" },
                            A1Min: { type: "number" },
                            A1StdDev: { type: "number" },
                            A1Count: { type: "number" },
                            A2Avg: { type: "number" },
                            A2Max: { type: "number" },
                            A2Min: { type: "number" },
                            A2StdDev: { type: "number" },
                            A2Count: { type: "number" },
                            A3Avg: { type: "number" },
                            A3Max: { type: "number" },
                            A3Min: { type: "number" },
                            A3StdDev: { type: "number" },
                            A3Count: { type: "number" },
                            A4Avg: { type: "number" },
                            A4Max: { type: "number" },
                            A4Min: { type: "number" },
                            A4StdDev: { type: "number" },
                            A4Count: { type: "number" },
                            A5Avg: { type: "number" },
                            A5Max: { type: "number" },
                            A5Min: { type: "number" },
                            A5StdDev: { type: "number" },
                            A5Count: { type: "number" },
                            A6Avg: { type: "number" },
                            A6Max: { type: "number" },
                            A6Min: { type: "number" },
                            A6StdDev: { type: "number" },
                            A6Count: { type: "number" },
                            A7Avg: { type: "number" },
                            A7Max: { type: "number" },
                            A7Min: { type: "number" },
                            A7StdDev: { type: "number" },
                            A7Count: { type: "number" },
                            A8Avg: { type: "number" },
                            A8Max: { type: "number" },
                            A8Min: { type: "number" },
                            A8StdDev: { type: "number" },
                            A8Count: { type: "number" },
                            A9Avg: { type: "number" },
                            A9Max: { type: "number" },
                            A9Min: { type: "number" },
                            A9StdDev: { type: "number" },
                            A9Count: { type: "number" },
                            A10Avg: { type: "number" },
                            A10Max: { type: "number" },
                            A10Min: { type: "number" },
                            A10StdDev: { type: "number" },
                            A10Count: { type: "number" },
                            AC1Avg: { type: "number" },
                            AC1Max: { type: "number" },
                            AC1Min: { type: "number" },
                            AC1StdDev: { type: "number" },
                            AC1Count: { type: "number" },
                            AC2Avg: { type: "number" },
                            AC2Max: { type: "number" },
                            AC2Min: { type: "number" },
                            AC2StdDev: { type: "number" },
                            AC2Count: { type: "number" },
                            C1Avg: { type: "number" },
                            C1Max: { type: "number" },
                            C1Min: { type: "number" },
                            C1StdDev: { type: "number" },
                            C1Count: { type: "number" },
                            C2Avg: { type: "number" },
                            C2Max: { type: "number" },
                            C2Min: { type: "number" },
                            C2StdDev: { type: "number" },
                            C2Count: { type: "number" },
                            C3Avg: { type: "number" },
                            C3Max: { type: "number" },
                            C3Min: { type: "number" },
                            C3StdDev: { type: "number" },
                            C3Count: { type: "number" },
                            D1Avg: { type: "number" },
                            D1Max: { type: "number" },
                            D1Min: { type: "number" },
                            D1StdDev: { type: "number" },
                            M1_1Avg: { type: "number" },
                            M1_1Max: { type: "number" },
                            M1_1Min: { type: "number" },
                            M1_1StdDev: { type: "number" },
                            M1_1Count: { type: "number" },
                            M1_2Avg: { type: "number" },
                            M1_2Max: { type: "number" },
                            M1_2Min: { type: "number" },
                            M1_2StdDev: { type: "number" },
                            M1_2Count: { type: "number" },
                            M1_3Avg: { type: "number" },
                            M1_3Max: { type: "number" },
                            M1_3Min: { type: "number" },
                            M1_3StdDev: { type: "number" },
                            M1_3Count: { type: "number" },
                            M1_4Avg: { type: "number" },
                            M1_4Max: { type: "number" },
                            M1_4Min: { type: "number" },
                            M1_4StdDev: { type: "number" },
                            M1_4Count: { type: "number" },
                            M1_5Avg: { type: "number" },
                            M1_5Max: { type: "number" },
                            M1_5Min: { type: "number" },
                            M1_5StdDev: { type: "number" },
                            M1_5Count: { type: "number" },
                            M2_1Avg: { type: "number" },
                            M2_1Max: { type: "number" },
                            M2_1Min: { type: "number" },
                            M2_1StdDev: { type: "number" },
                            M2_1Count: { type: "number" },
                            M2_2Avg: { type: "number" },
                            M2_2Max: { type: "number" },
                            M2_2Min: { type: "number" },
                            M2_2StdDev: { type: "number" },
                            M2_2Count: { type: "number" },
                            M2_3Avg: { type: "number" },
                            M2_3Max: { type: "number" },
                            M2_3Min: { type: "number" },
                            M2_3StdDev: { type: "number" },
                            M2_3Count: { type: "number" },
                            M2_4Avg: { type: "number" },
                            M2_4Max: { type: "number" },
                            M2_4Min: { type: "number" },
                            M2_4StdDev: { type: "number" },
                            M2_4Count: { type: "number" },
                            M2_5Avg: { type: "number" },
                            M2_5Max: { type: "number" },
                            M2_5Min: { type: "number" },
                            M2_5StdDev: { type: "number" },
                            M2_5Count: { type: "number" },
                            M2_6Avg: { type: "number" },
                            M2_6Max: { type: "number" },
                            M2_6Min: { type: "number" },
                            M2_6StdDev: { type: "number" },
                            M2_6Count: { type: "number" },
                            M2_7Avg: { type: "number" },
                            M2_7Max: { type: "number" },
                            M2_7Min: { type: "number" },
                            M2_7StdDev: { type: "number" },
                            M2_7Count: { type: "number" },
                            M2_8Avg: { type: "number" },
                            M2_8Max: { type: "number" },
                            M2_8Min: { type: "number" },
                            M2_8StdDev: { type: "number" },
                            M2_8Count: { type: "number" },
                            VAvg: { type: "number" },
                            VMax: { type: "number" },
                            VMin: { type: "number" },
                            IAvg: { type: "number" },
                            IMax: { type: "number" },
                            IMin: { type: "number" },
                            T: { type: "number" },
                            addr: { type: "number" },
                        }
                    },
                    data: function (res) {
                        app.loading(false);
                        if (!app.isFine(res)) {
                            return;
                        }
                        return res.data.Data
                    },
                    total: function (res) {
                        if (!app.isFine(res)) {
                            return;
                        }
                        $('#totaldatamet').html(kendo.toString(res.data.Total, 'n0'));
                        return res.data.Total;
                    }
                },
                sort: [
                    { field: 'TimeStamp', dir: 'asc' }
                ],
            },
            selectable: "multiple",
            groupable: false,
            sortable: true,
            filterable: {
                extra: false,
                operators: {
                    string: {
                        eq: "Is equal to",
                        neq: "Is not equal to",
                        gt: "Is greater than",
                        gte: "Is greater than or equal to",
                        lt: "Is less than",
                        lte: "Is less than or equal to"
                    }
                }
            },
            filterMenuInit: function (e) {
                e.container.data("kendoPopup").bind("open", function () {
                    // console.log(e.container);
                    if (e.container.is(".k-grid-filter")) {
                        e.container.find("form").removeClass("k-state-border-up");
                        e.container.find("form").addClass("k-state-border-down");
                        // console.log(e.container[0]);
                    } else {
                        // console.log("test");
                    }


                });
            },
            pageable: true,
            //resizable: true,
            columns: [
                { title: "Date", field: "TimeStamp", template: "#= kendo.toString(moment.utc(TimeStamp).format('DD-MMM-YYYY HH:mm:ss'), 'dd-MMM-yyyy HH:mm:ss') #", width: 150, locked: true, filterable: false },

                { title: "V Hub</br>WS 90m Avg", field: "VHubWS90mAvg", format: "{0:n2}", width: 80, attributes: { class: "align-right" }, filterable: false },
                { title: "V Hub</br>WS 90m Max", field: "VHubWS90mMax", format: "{0:n2}", width: 90, attributes: { class: "align-right" }, filterable: false },
                { title: "V Hub</br>WS 90m Min", field: "VHubWS90mMin", format: "{0:n2}", width: 80, attributes: { class: "align-right" }, filterable: false },
                { title: "V Hub</br>WS 90m Std Dev", field: "VHubWS90mStdDev", format: "{0:n2}", width: 100, attributes: { class: "align-right" }, filterable: false },
                { title: "V Hub</br>WS 90m Count", field: "VHubWS90mCount", format: "{0:n2}", width: 100, attributes: { class: "align-right" }, filterable: false },

                { title: "V Ref</br>WS 88m Avg", field: "VRefWS88mAvg", format: "{0:n2}", width: 80, attributes: { class: "align-right" }, filterable: false },
                { title: "V Ref</br>WS 88m Max", field: "VRefWS88mMax", format: "{0:n2}", width: 90, attributes: { class: "align-right" }, filterable: false },
                { title: "V Ref</br>WS 88m Min", field: "VRefWS88mMin", format: "{0:n2}", width: 80, attributes: { class: "align-right" }, filterable: false },
                { title: "V Ref</br>WS 88m Std Dev", field: "VRefWS88mStdDev", format: "{0:n2}", width: 100, attributes: { class: "align-right" }, filterable: false },
                { title: "V Ref</br>WS 88m Count", field: "VRefWS88mCount", format: "{0:n2}", width: 100, attributes: { class: "align-right" }, filterable: false },

                { title: "V Tip</br>WS 42m Avg", field: "VTipWS42mAvg", format: "{0:n2}", width: 80, attributes: { class: "align-right" }, filterable: false },
                { title: "V Tip</br>WS 42m Max", field: "VTipWS42mMax", format: "{0:n2}", width: 90, attributes: { class: "align-right" }, filterable: false },
                { title: "V Tip</br>WS 42m Min", field: "VTipWS42mMin", format: "{0:n2}", width: 80, attributes: { class: "align-right" }, filterable: false },
                { title: "V Tip</br>WS 42m Std Dev", field: "VTipWS42mStdDev", format: "{0:n2}", width: 100, attributes: { class: "align-right" }, filterable: false },
                { title: "V Tip</br>WS 42m Count", field: "VTipWS42mCount", format: "{0:n2}", width: 100, attributes: { class: "align-right" }, filterable: false },

                { title: "D Hub</br>WD 88m Avg", field: "DHubWD88mAvg", format: "{0:n2}", width: 80, attributes: { class: "align-right" }, filterable: false },
                { title: "D Hub</br>WD 88m Max", field: "DHubWD88mMax", format: "{0:n2}", width: 90, attributes: { class: "align-right" }, filterable: false },
                { title: "D Hub</br>WD 88m Min", field: "DHubWD88mMin", format: "{0:n2}", width: 80, attributes: { class: "align-right" }, filterable: false },
                { title: "D Hub</br>WD 88m Std Dev", field: "DHubWD88mStdDev", format: "{0:n2}", width: 110, attributes: { class: "align-right" }, filterable: false },
                { title: "D Hub</br>WD 88m Count", field: "DHubWD88mCount", format: "{0:n2}", width: 100, attributes: { class: "align-right" }, filterable: false },

                { title: "D Ref</br>WD 86m Avg", field: "DRefWD86mAvg", format: "{0:n2}", width: 80, attributes: { class: "align-right" }, filterable: false },
                { title: "D Ref</br>WD 86m Max", field: "DRefWD86mMax", format: "{0:n2}", width: 90, attributes: { class: "align-right" }, filterable: false },
                { title: "D Ref</br>WD 86m Min", field: "DRefWD86mMin", format: "{0:n2}", width: 80, attributes: { class: "align-right" }, filterable: false },
                { title: "D Ref</br>WD 86m Std Dev", field: "DRefWD86mStdDev", format: "{0:n2}", width: 110, attributes: { class: "align-right" }, filterable: false },
                { title: "D Ref</br>WD 86m Count", field: "DRefWD86mCount", format: "{0:n2}", width: 100, attributes: { class: "align-right" }, filterable: false },

                { title: "T Hub & H Hub</br>Humid 85m Avg", format: "{0:n2}", field: "THubHHubHumid855mAvg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Hub & H Hub</br>Humid 85m Max", format: "{0:n2}", field: "THubHHubHumid855mMax", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Hub & H Hub</br>Humid 85m Min", format: "{0:n2}", field: "THubHHubHumid855mMin", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Hub & H Hub</br>Humid 85m Std Dev", format: "{0:n2}", field: "THubHHubHumid855mStdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Hub & H Hub</br>Humid 85m Count", format: "{0:n2}", field: "THubHHubHumid855mCount", width: 120, attributes: { class: "align-right" }, filterable: false },

                { title: "T Ref & H Ref</br>Humid 85.5m Avg", format: "{0:n2}", field: "TRefHRefHumid855mAvg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Ref & H Ref</br>Humid 85.5m Max", format: "{0:n2}", field: "TRefHRefHumid855mMax", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Ref & H Ref</br>Humid 85.5m Min", format: "{0:n2}", field: "TRefHRefHumid855mMin", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Ref & H Ref</br>Humid 85.5m Std Dev", format: "{0:n2}", field: "TRefHRefHumid855mStdDev", width: 130, attributes: { class: "align-right" }, filterable: false },
                { title: "T Ref & H Ref</br>Humid 85.5m Count", format: "{0:n2}", field: "TRefHRefHumid855mCount", width: 120, attributes: { class: "align-right" }, filterable: false },

                { title: "T Hub & H Hub</br>Temp 85.5m Avg", format: "{0:n2}", field: "THubHHubTemp855mAvg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Hub & H Hub</br>Temp 85.5m Max", format: "{0:n2}", field: "THubHHubTemp855mMax", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Hub & H Hub</br>Temp 85.5m Min", format: "{0:n2}", field: "THubHHubTemp855mMin", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Hub & H Hub</br>Temp 85.5m Std Dev", format: "{0:n2}", field: "THubHHubTemp855mStdDev", width: 130, attributes: { class: "align-right" }, filterable: false },
                { title: "T Hub & H Hub</br>Temp 85.5m Count", format: "{0:n2}", field: "THubHHubTemp855mCount", width: 120, attributes: { class: "align-right" }, filterable: false },

                { title: "T Ref & H Ref</br>Temp 85.5 Avg", format: "{0:n2}", field: "TRefHRefTemp855mAvg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Ref & H Ref</br>Temp 85.5 Max", format: "{0:n2}", field: "TRefHRefTemp855mMax", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Ref & H Ref</br>Temp 85.5 Min", format: "{0:n2}", field: "TRefHRefTemp855mMin", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T Ref & H Ref</br>Temp 85.5 Std Dev", format: "{0:n2}", field: "TRefHRefTemp855mStdDev", width: 130, attributes: { class: "align-right" }, filterable: false },
                { title: "T Ref & H Ref</br>Temp 85.5 Count", format: "{0:n2}", field: "TRefHRefTemp855mCount", width: 120, attributes: { class: "align-right" }, filterable: false },

                { title: "Baro Air Pressure</br>85.5m Avg", format: "{0:n2}", field: "BaroAirPress855mAvg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Baro Air Pressure</br>85.5m Max", format: "{0:n2}", field: "BaroAirPress855mMax", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Baro Air Pressure</br>85.5m Min", format: "{0:n2}", field: "BaroAirPress855mMin", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Baro Air Pressure</br>85.5m Std Dev", format: "{0:n2}", field: "BaroAirPress855mStdDev", width: 130, attributes: { class: "align-right" }, filterable: false },
                { title: "Baro Air Pressure</br>85.5m Count", format: "{0:n2}", field: "BaroAirPress855mCount", width: 120, attributes: { class: "align-right" }, filterable: false },

                { title: "Yaw angle Voltage Avg", format: "{0:n2}", field: "YawAngleVoltageAvg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Yaw angle Voltage Max", format: "{0:n2}", field: "YawAngleVoltageMax", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Yaw angle Voltage Min", format: "{0:n2}", field: "YawAngleVoltageMin", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Yaw angle Voltage StdDev", format: "{0:n2}", field: "YawAngleVoltageStdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Yaw angle Voltage Count", format: "{0:n2}", field: "YawAngleVoltageCount", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI1 Avg", format: "{0:n2}", field: "OtherSensorVoltageAI1Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI1 Max", format: "{0:n2}", field: "OtherSensorVoltageAI1Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI1 Min", format: "{0:n2}", field: "OtherSensorVoltageAI1Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI1 StdDev", format: "{0:n2}", field: "OtherSensorVoltageAI1StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI1 Count", format: "{0:n2}", field: "OtherSensorVoltageAI1Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI2 Avg", format: "{0:n2}", field: "OtherSensorVoltageAI2Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI2 Max", format: "{0:n2}", field: "OtherSensorVoltageAI2Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI2 Min", format: "{0:n2}", field: "OtherSensorVoltageAI2Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI2 StdDev", format: "{0:n2}", field: "OtherSensorVoltageAI2StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI2 Count", format: "{0:n2}", field: "OtherSensorVoltageAI2Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI3 Avg", format: "{0:n2}", field: "OtherSensorVoltageAI3Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI3 Max", format: "{0:n2}", field: "OtherSensorVoltageAI3Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI3 Min", format: "{0:n2}", field: "OtherSensorVoltageAI3Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI3 StdDev", format: "{0:n2}", field: "OtherSensorVoltageAI3StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI3 Count", format: "{0:n2}", field: "OtherSensorVoltageAI3Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI4 Avg", format: "{0:n2}", field: "OtherSensorVoltageAI4Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI4 Max", format: "{0:n2}", field: "OtherSensorVoltageAI4Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI4 Min", format: "{0:n2}", field: "OtherSensorVoltageAI4Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI4 StdDev", format: "{0:n2}", field: "OtherSensorVoltageAI4StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor Voltage AI4 Count", format: "{0:n2}", field: "OtherSensorVoltageAI4Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Gen RPM Current Avg", format: "{0:n2}", field: "GenRPMCurrentAvg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Gen RPM Current Max", format: "{0:n2}", field: "GenRPMCurrentMax", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Gen RPM Current Min", format: "{0:n2}", field: "GenRPMCurrentMin", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Gen RPM Current StdDev", format: "{0:n2}", field: "GenRPMCurrentStdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Gen RPM Current Count", format: "{0:n2}", field: "GenRPMCurrentCount", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "ws SCS Current Avg", format: "{0:n2}", field: "WS_SCSCurrentAvg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "ws SCS Current Max", format: "{0:n2}", field: "WS_SCSCurrentMax", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "ws SCS Current Min", format: "{0:n2}", field: "WS_SCSCurrentMin", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "ws SCS Current StdDev", format: "{0:n2}", field: "WS_SCSCurrentStdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "ws SCS Current Count", format: "{0:n2}", field: "WS_SCSCurrentCount", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Rain Status Count", format: "{0:n2}", field: "RainStatusCount", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Rain Status Sum", format: "{0:n2}", field: "RainStatusSum", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO1 Avg", format: "{0:n2}", field: "OtherSensor2StatusIO1Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO1 Max", format: "{0:n2}", field: "OtherSensor2StatusIO1Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO1 Min", format: "{0:n2}", field: "OtherSensor2StatusIO1Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO1 StdDev", format: "{0:n2}", field: "OtherSensor2StatusIO1StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO1 Count", format: "{0:n2}", field: "OtherSensor2StatusIO1Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO2 Avg", format: "{0:n2}", field: "OtherSensor2StatusIO2Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO2 Max", format: "{0:n2}", field: "OtherSensor2StatusIO2Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO2 Min", format: "{0:n2}", field: "OtherSensor2StatusIO2Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO2 StdDev", format: "{0:n2}", field: "OtherSensor2StatusIO2StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO2 Count", format: "{0:n2}", field: "OtherSensor2StatusIO2Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO3 Avg", format: "{0:n2}", field: "OtherSensor2StatusIO3Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO3 Max", format: "{0:n2}", field: "OtherSensor2StatusIO3Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO3 Min", format: "{0:n2}", field: "OtherSensor2StatusIO3Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO3 StdDev", format: "{0:n2}", field: "OtherSensor2StatusIO3StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO3 Count", format: "{0:n2}", field: "OtherSensor2StatusIO3Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO4 Avg", format: "{0:n2}", field: "OtherSensor2StatusIO4Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO4 Max", format: "{0:n2}", field: "OtherSensor2StatusIO4Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO4 Min", format: "{0:n2}", field: "OtherSensor2StatusIO4Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO4 StdDev", format: "{0:n2}", field: "OtherSensor2StatusIO4StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO4 Count", format: "{0:n2}", field: "OtherSensor2StatusIO4Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO5 Avg", format: "{0:n2}", field: "OtherSensor2StatusIO5Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO5 Max", format: "{0:n2}", field: "OtherSensor2StatusIO5Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO5 Min", format: "{0:n2}", field: "OtherSensor2StatusIO5Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO5 StdDev", format: "{0:n2}", field: "OtherSensor2StatusIO5StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "Other Sensor 2 Status IO5 Count", format: "{0:n2}", field: "OtherSensor2StatusIO5Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A1 Avg", format: "{0:n2}", field: "A1Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A1 Max", format: "{0:n2}", field: "A1Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A1 Min", format: "{0:n2}", field: "A1Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A1 StdDev", format: "{0:n2}", field: "A1StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A1 Count", format: "{0:n2}", field: "A1Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A2 Avg", format: "{0:n2}", field: "A2Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A2 Max", format: "{0:n2}", field: "A2Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A2 Min", format: "{0:n2}", field: "A2Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A2 StdDev", format: "{0:n2}", field: "A2StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A2 Count", format: "{0:n2}", field: "A2Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A3 Avg", format: "{0:n2}", field: "A3Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A3 Max", format: "{0:n2}", field: "A3Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A3 Min", format: "{0:n2}", field: "A3Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A3 StdDev", format: "{0:n2}", field: "A3StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A3 Count", format: "{0:n2}", field: "A3Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A4 Avg", format: "{0:n2}", field: "A4Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A4 Max", format: "{0:n2}", field: "A4Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A4 Min", format: "{0:n2}", field: "A4Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A4 StdDev", format: "{0:n2}", field: "A4StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A4 Count", format: "{0:n2}", field: "A4Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A5 Avg", format: "{0:n2}", field: "A5Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A5 Max", format: "{0:n2}", field: "A5Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A5 Min", format: "{0:n2}", field: "A5Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A5 StdDev", format: "{0:n2}", field: "A5StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A5 Count", format: "{0:n2}", field: "A5Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A6 Avg", format: "{0:n2}", field: "A6Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A6 Max", format: "{0:n2}", field: "A6Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A6 Min", format: "{0:n2}", field: "A6Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A6 StdDev", format: "{0:n2}", field: "A6StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A6 Count", format: "{0:n2}", field: "A6Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A7 Avg", format: "{0:n2}", field: "A7Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A7 Max", format: "{0:n2}", field: "A7Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A7 Min", format: "{0:n2}", field: "A7Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A7 StdDev", format: "{0:n2}", field: "A7StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A7 Count", format: "{0:n2}", field: "A7Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A8 Avg", format: "{0:n2}", field: "A8Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A8 Max", format: "{0:n2}", field: "A8Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A8 Min", format: "{0:n2}", field: "A8Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A8 StdDev", format: "{0:n2}", field: "A8StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A8 Count", format: "{0:n2}", field: "A8Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A9 Avg", format: "{0:n2}", field: "A9Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A9 Max", format: "{0:n2}", field: "A9Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A9 Min", format: "{0:n2}", field: "A9Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A9 StdDev", format: "{0:n2}", field: "A9StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A9 Count", format: "{0:n2}", field: "A9Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A10 Avg", format: "{0:n2}", field: "A10Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A10 Max", format: "{0:n2}", field: "A10Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A10 Min", format: "{0:n2}", field: "A10Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A10 StdDev", format: "{0:n2}", field: "A10StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "A10 Count", format: "{0:n2}", field: "A10Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "AC1 Avg", format: "{0:n2}", field: "AC1Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "AC1 Max", format: "{0:n2}", field: "AC1Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "AC1 Min", format: "{0:n2}", field: "AC1Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "AC1 StdDev", format: "{0:n2}", field: "AC1StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "AC1 Count", format: "{0:n2}", field: "AC1Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "AC2 Avg", format: "{0:n2}", field: "AC2Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "AC2 Max", format: "{0:n2}", field: "AC2Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "AC2 Min", format: "{0:n2}", field: "AC2Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "AC2 StdDev", format: "{0:n2}", field: "AC2StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "AC2 Count", format: "{0:n2}", field: "AC2Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C1 Avg", format: "{0:n2}", field: "C1Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C1 Max", format: "{0:n2}", field: "C1Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C1 Min", format: "{0:n2}", field: "C1Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C1 StdDev", format: "{0:n2}", field: "C1StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C1 Count", format: "{0:n2}", field: "C1Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C2 Avg", format: "{0:n2}", field: "C2Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C2 Max", format: "{0:n2}", field: "C2Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C2 Min", format: "{0:n2}", field: "C2Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C2 StdDev", format: "{0:n2}", field: "C2StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C2 Count", format: "{0:n2}", field: "C2Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C3 Avg", format: "{0:n2}", field: "C3Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C3 Max", format: "{0:n2}", field: "C3Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C3 Min", format: "{0:n2}", field: "C3Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C3 StdDev", format: "{0:n2}", field: "C3StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "C3 Count", format: "{0:n2}", field: "C3Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "D1 Avg", format: "{0:n2}", field: "D1Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "D1 Max", format: "{0:n2}", field: "D1Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "D1 Min", format: "{0:n2}", field: "D1Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "D1 StdDev", format: "{0:n2}", field: "D1StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 1 Avg", format: "{0:n2}", field: "M1_1Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 1 Max", format: "{0:n2}", field: "M1_1Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 1 Min", format: "{0:n2}", field: "M1_1Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 1 StdDev", format: "{0:n2}", field: "M1_1StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 1 Count", format: "{0:n2}", field: "M1_1Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 2 Avg", format: "{0:n2}", field: "M1_2Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 2 Max", format: "{0:n2}", field: "M1_2Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 2 Min", format: "{0:n2}", field: "M1_2Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 2 StdDev", format: "{0:n2}", field: "M1_2StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 2 Count", format: "{0:n2}", field: "M1_2Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 3 Avg", format: "{0:n2}", field: "M1_3Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 3 Max", format: "{0:n2}", field: "M1_3Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 3 Min", format: "{0:n2}", field: "M1_3Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 3 StdDev", format: "{0:n2}", field: "M1_3StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 3 Count", format: "{0:n2}", field: "M1_3Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 4 Avg", format: "{0:n2}", field: "M1_4Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 4 Max", format: "{0:n2}", field: "M1_4Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 4 Min", format: "{0:n2}", field: "M1_4Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 4 StdDev", format: "{0:n2}", field: "M1_4StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 4 Count", format: "{0:n2}", field: "M1_4Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 5 Avg", format: "{0:n2}", field: "M1_5Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 5 Max", format: "{0:n2}", field: "M1_5Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 5 Min", format: "{0:n2}", field: "M1_5Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 5 StdDev", format: "{0:n2}", field: "M1_5StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M1 5 Count", format: "{0:n2}", field: "M1_5Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 1 Avg", format: "{0:n2}", field: "M2_1Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 1 Max", format: "{0:n2}", field: "M2_1Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 1 Min", format: "{0:n2}", field: "M2_1Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 1 StdDev", format: "{0:n2}", field: "M2_1StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 1 Count", format: "{0:n2}", field: "M2_1Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 2 Avg", format: "{0:n2}", field: "M2_2Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 2 Max", format: "{0:n2}", field: "M2_2Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 2 Min", format: "{0:n2}", field: "M2_2Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 2 StdDev", format: "{0:n2}", field: "M2_2StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 2 Count", format: "{0:n2}", field: "M2_2Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 3 Avg", format: "{0:n2}", field: "M2_3Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 3 Max", format: "{0:n2}", field: "M2_3Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 3 Min", format: "{0:n2}", field: "M2_3Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 3 StdDev", format: "{0:n2}", field: "M2_3StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 3 Count", format: "{0:n2}", field: "M2_3Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 4 Avg", format: "{0:n2}", field: "M2_4Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 4 Max", format: "{0:n2}", field: "M2_4Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 4 Min", format: "{0:n2}", field: "M2_4Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 4 StdDev", format: "{0:n2}", field: "M2_4StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 4 Count", format: "{0:n2}", field: "M2_4Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 5 Avg", format: "{0:n2}", field: "M2_5Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 5 Max", format: "{0:n2}", field: "M2_5Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 5 Min", format: "{0:n2}", field: "M2_5Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 5 StdDev", format: "{0:n2}", field: "M2_5StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 5 Count", format: "{0:n2}", field: "M2_5Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 6 Avg", format: "{0:n2}", field: "M2_6Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 6 Max", format: "{0:n2}", field: "M2_6Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 6 Min", format: "{0:n2}", field: "M2_6Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 6 StdDev", format: "{0:n2}", field: "M2_6StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 6 Count", format: "{0:n2}", field: "M2_6Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 7 Avg", format: "{0:n2}", field: "M2_7Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 7 Max", format: "{0:n2}", field: "M2_7Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 7 Min", format: "{0:n2}", field: "M2_7Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 7 StdDev", format: "{0:n2}", field: "M2_7StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 7 Count", format: "{0:n2}", field: "M2_7Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 8 Avg", format: "{0:n2}", field: "M2_8Avg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 8 Max", format: "{0:n2}", field: "M2_8Max", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 8 Min", format: "{0:n2}", field: "M2_8Min", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 8 StdDev", format: "{0:n2}", field: "M2_8StdDev", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "M2 8 Count", format: "{0:n2}", field: "M2_8Count", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "V Avg", format: "{0:n2}", field: "VAvg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "V Max", format: "{0:n2}", field: "VMax", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "V Min", format: "{0:n2}", field: "VMin", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "I Avg", format: "{0:n2}", field: "IAvg", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "I Max", format: "{0:n2}", field: "IMax", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "I Min", format: "{0:n2}", field: "IMin", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "T", format: "{0:n2}", field: "T", width: 120, attributes: { class: "align-right" }, filterable: false },
                { title: "addr", format: "{0:n2}", field: "addr", width: 120, attributes: { class: "align-right" }, filterable: false },

            ]
        });

        /*var grid = $('#dataGridMet').data('kendoGrid');
        var columns = grid.columns;
        dbr.gridColumnsScada([]);
        $.each(columns, function(i, val){
        	$('#dataGridMet').data("kendoGrid").showColumn(val.field);
        	var result = {
         			field : val.field, 
         			title : val.title,
         			value : true
         	}
         	dbr.gridColumnsScada.push(result);
        });*/
    },
    InitDefault: function () {
        var lastStartDate = new Date(Date.UTC(2016, 5, 30, 0, 0, 0, 0));
        var lastEndDate = new Date(Date.UTC(2016, 5, 23, 0, 0, 0, 0));
        $('#dateEnd').data('kendoDatePicker').value(lastStartDate);
        $('#dateStart').data('kendoDatePicker').value(lastEndDate);

        setTimeout(function () {
            Data.LoadData();
        }, 500);
    }
};

vm.currentMenu('Data Browser');
vm.currentTitle('Data Browser');
vm.breadcrumb([{ title: 'Data Browser', href: viewModel.appName + 'page/databrowser' }]);

$(document).ready(function () {
    app.loading(true);
    dbr.populateTurbine();
    $('#btnRefresh').on('click', function () {
        Data.LoadData();
    });

    setTimeout(function () {
        Data.InitDefault();
    }, 1000);
    Data.LoadAvailDate();
});