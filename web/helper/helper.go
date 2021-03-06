package helper

import (
	. "github.com/eaciit/windapp/library/core"
	"errors"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
)

var (
	DebugMode bool
	DownTypes = []toolkit.M{
		{"down": "aebok", "label": "AEBok"},
		{"down": "externalstop", "label": "External Stop"},
		{"down": "griddown", "label": "Grid Down"},
		{"down": "internalgrid", "label": "Internal Grid"},
		{"down": "machinedown", "label": "Machine Down"},
		{"down": "unknown", "label": "Unknown"},
		{"down": "weatherstop", "label": "Weather Stop"},
	}
)

type PayloadsDB struct {
	Turbine         []interface{}
	DateStart       time.Time
	DateEnd         time.Time
	Skip   int
	Take   int
	Sort   []Sorting
	Filter *FilterJS `json:"filter"`
	Misc   toolkit.M `json:"misc"`
}

type Payloads struct {
	Skip   int
	Take   int
	Sort   []Sorting
	Filter *FilterJS `json:"filter"`
	Misc   toolkit.M `json:"misc"`
	Custom toolkit.M `json:"custom"`
}

type Sorting struct {
	Field string
	Dir   string
}

type FilterJS struct {
	Filters []*Filter `json:"filters"`
	Logic   string
}

type Filter struct {
	Field string      `json:"field"`
	Op    string      `json:"operator"`
	Value interface{} `json:"value"`
}

func (s *Payloads) ParseFilter() (filters []*dbox.Filter, err error) {
	datelist := []string{
		"timestamp",
		"dateinfo.dateid",
		"startdate",
	}

	if s != nil {
		for _, each := range s.Filter.Filters {
			field := strings.ToLower(each.Field)
			switch each.Op {
			case "gte":
				var value interface{} = each.Value
				if toolkit.TypeName(value) == "string" {
					if value.(string) != "" {
						if toolkit.HasMember(datelist, field) {
							var t time.Time
							b, err := time.Parse("2006-01-02T15:04:05.000Z", value.(string))
							if err != nil {
								toolkit.Println(err.Error())
							}
							if s.Misc.Has("period") {
								t, _, err = GetStartEndDate(s.Misc["knot_data"].(*knot.WebContext), s.Misc.GetString("period"), b, b)
							} else {
								t, _ = time.Parse("2006-01-02 15:04:05", b.UTC().Format("2006-01-02")+" 00:00:00")
							}
							value = t
						}
						filters = append(filters, dbox.Gte(field, value))
					}
				} else {
					filters = append(filters, dbox.Gte(field, value))
				}
			case "gt":
				var value interface{} = each.Value
				if toolkit.TypeName(value) == "string" {
					if value.(string) != "" {
						if toolkit.HasMember(datelist, field) {
							var t time.Time
							b, err := time.Parse("2006-01-02T15:04:05.000Z", value.(string))
							if err != nil {
								toolkit.Println(err.Error())
							}
							if s.Misc.Has("period") {
								t, _, err = GetStartEndDate(s.Misc["knot_data"].(*knot.WebContext), s.Misc.GetString("period"), b, b)
							} else {
								t, _ = time.Parse("2006-01-02 15:04:05", b.UTC().Format("2006-01-02")+" 00:00:00")
							}
							value = t
						}
						filters = append(filters, dbox.Gt(field, value))
					}
				} else {
					filters = append(filters, dbox.Gt(field, value))
				}
			case "lte":
				var value interface{} = each.Value

				if toolkit.TypeName(value) == "string" {
					if value.(string) != "" {
						if toolkit.HasMember(datelist, field) {
							var t time.Time
							b, err := time.Parse("2006-01-02T15:04:05.000Z", value.(string))
							if err != nil {
								toolkit.Println(err.Error())
							}
							if s.Misc.Has("period") {
								_, t, err = GetStartEndDate(s.Misc["knot_data"].(*knot.WebContext), s.Misc.GetString("period"), b, b)
							} else {
								t, _ = time.Parse("2006-01-02 15:04:05", b.UTC().Format("2006-01-02")+" 23:59:59")
							}
							value = t
						}
						filters = append(filters, dbox.Lte(field, value))
					}
				} else {
					filters = append(filters, dbox.Lte(field, value))
				}
			case "lt":
				var value interface{} = each.Value

				if toolkit.TypeName(value) == "string" {
					if value.(string) != "" {
						if toolkit.HasMember(datelist, field) {
							var t time.Time
							b, err := time.Parse("2006-01-02T15:04:05.000Z", value.(string))
							if err != nil {
								toolkit.Println(err.Error())
							}
							if s.Misc.Has("period") {
								_, t, err = GetStartEndDate(s.Misc["knot_data"].(*knot.WebContext), s.Misc.GetString("period"), b, b)
							} else {
								t, _ = time.Parse("2006-01-02 15:04:05", b.UTC().Format("2006-01-02")+" 23:59:59")
							}
							value = t
						}
						filters = append(filters, dbox.Lt(field, value))
					}
				} else {
					filters = append(filters, dbox.Lt(field, value))
				}
			case "eq":
				value := each.Value

				if field == "turbine" && value.(string) == "" {
					continue
				} else if field == "isvalidtimeduration" && value.(bool) == true {
					continue
				} else if field == "projectid" && value.(string) == "" {
					continue
				}

				filters = append(filters, dbox.Eq(field, value))
			case "neq":
				value := each.Value
				filters = append(filters, dbox.Ne(field, value))
			case "in":
				value := each.Value
				if (field == "turbineid" && toolkit.SliceLen(value) == 0) ||
					field == "turbine" && toolkit.SliceLen(value) == 0 {
					continue
				}
				filters = append(filters, dbox.In(field, value.([]interface{})...))
			}
		}
	}

	/*toolkit.Println("======= PARSE FILTER =======")
	for _, val := range filters {
		toolkit.Println(val.Field, val.Op, val.Value)
	}*/

	return
}

func HandleError(err error, optionalArgs ...interface{}) bool {
	if err != nil {
		toolkit.Printf("error occured: %s", err.Error())

		if len(optionalArgs) > 0 {
			optionalArgs[0].(func(bool))(false)
		}

		return false
	}

	if len(optionalArgs) > 0 {
		optionalArgs[0].(func(bool))(true)
	}

	return true
}

func CheckEnergyComparison(newdata toolkit.Ms, key1 string, key2 string) toolkit.Ms {
	countData1 := 0
	countData2 := 0
	result := toolkit.Ms{}
	measurement := ""
	for _, data := range newdata {
		if data.GetFloat64(key1) < data.GetFloat64(key2) {
			countData1++
		} else {
			countData2++
		}
	}

	kunciData := ""
	if countData1 > countData2 {
		kunciData = key1
	} else {
		kunciData = key2
	}

	countSatuan := toolkit.M{}

	for _, data := range newdata {
		cekVal := data.GetFloat64(kunciData) / 1000000
		energyType := "GWh"
		if cekVal < 1 {
			cekVal = data.GetFloat64(kunciData) / 1000
			energyType = "MWh"
			if cekVal < 1 {
				cekVal = data.GetFloat64(kunciData)
				energyType = "kWh"
			}
		}
		if countSatuan.Has(energyType) {
			countSatuan.Set(energyType, countSatuan.GetInt(energyType)+1)
		} else {
			countSatuan.Set(energyType, 1)
		}
	}

	pembagi := 0.00
	if (countSatuan.GetInt("GWh") > countSatuan.GetInt("MWh")) && (countSatuan.GetInt("GWh") > countSatuan.GetInt("kWh")) {
		pembagi = 1000000
		measurement = "GWh"
	} else if (countSatuan.GetInt("MWh") > countSatuan.GetInt("GWh")) && (countSatuan.GetInt("MWh") > countSatuan.GetInt("kWh")) {
		pembagi = 1000
		measurement = "MWh"
	} else {
		pembagi = 1
		measurement = "kWh"
	}

	for _, data := range newdata {
		data.Set(key1, data.GetFloat64(key1)/pembagi)
		data.Set(key2, data.GetFloat64(key2)/pembagi)
		data.Set("measurement", measurement)
		result = append(result, data)
	}
	return result
}
func EnergyMeasurement(data interface{}, key1 string, key2 string) toolkit.Ms {
	result := toolkit.Ms{}
	newdata := toolkit.Ms{}
	if strings.Contains(toolkit.TypeName(data), "[]toolkit") {
		newdata = data.([]toolkit.M)
		result = CheckEnergyComparison(newdata, key1, key2)
	} else {
		_data := data.(toolkit.M)
		newdata = append(newdata, _data)
		result = CheckEnergyComparison(newdata, key1, key2)
	}

	return result
}

func CreateResult(success bool, data interface{}, message string) map[string]interface{} {
	if !success {
		toolkit.Println("ERROR! ", message)
		if DebugMode {
			panic(message)
		}
	}

	return map[string]interface{}{
		"data":    data,
		"success": success,
		"message": message,
	}
}

func ImageUploadHandler(r *knot.WebContext, filename, dstpath string) (error, string) {
	file, handler, err := r.Request.FormFile(filename)
	if err != nil {
		return err, ""
	}
	defer file.Close()

	newImageName := toolkit.RandomString(32) + filepath.Ext(handler.Filename)
	dstSource := dstpath + toolkit.PathSeparator + newImageName
	f, err := os.OpenFile(dstSource, os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		return err, ""
	}
	defer f.Close()
	io.Copy(f, file)

	return nil, newImageName
}

func UploadFileHandler(r *knot.WebContext, tempfile, dstpath, filename string) (error, string, string, string) {
	file, handler, err := r.Request.FormFile(tempfile)
	if err != nil {
		return err, "", "", ""
	}
	defer file.Close()

	ext := filepath.Ext(handler.Filename)
	newFileName := filename + ext
	dstSource := dstpath + toolkit.PathSeparator + newFileName
	f, err := os.OpenFile(dstSource, os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		return err, "", "", ""
	}
	defer f.Close()
	io.Copy(f, file)

	return nil, handler.Filename, newFileName, strings.Split(ext, ".")[1]
}

func UploadHandler(r *knot.WebContext, filename, dstpath string) (error, string) {
	file, handler, err := r.Request.FormFile(filename)
	if err != nil {
		return err, ""
	}
	defer file.Close()

	dstSource := dstpath + toolkit.PathSeparator + handler.Filename
	f, err := os.OpenFile(dstSource, os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		return err, ""
	}
	defer f.Close()
	_, err = io.Copy(f, file)
	if err != nil {
		return err, ""
	}
	toolkit.Println("Write file: " + dstSource)
	return nil, handler.Filename
}

func GetDayInYear(year int) toolkit.M {
	result := toolkit.M{}
	for m := time.January; m <= time.December; m++ {
		t := time.Date(year, m+1, 1, 0, 0, 0, 0, time.UTC)
		result.Set(toolkit.ToString(int(m)), t.Add(-24*time.Hour).Day())
	}
	return result
}

func GetDurationInMonth(tStart time.Time, tEnd time.Time) (int, []interface{}, toolkit.M) {
	durationMonths := 0
	monthDay := toolkit.M{}
	var months []interface{}
	xDate := tStart
	year := xDate.Year()
	month := int(xDate.Month())
	day := 1

	daysInYear := GetDayInYear(year)

	if (toolkit.ToString(xDate.Year()) + "" + toolkit.ToString(int(xDate.Month()))) != (toolkit.ToString(tEnd.Year()) + "" + toolkit.ToString(int(tEnd.Month()))) {
	out:
		for {
			xString := toolkit.ToString(xDate.Year()) + "" + toolkit.ToString(int(xDate.Month()))
			endString := toolkit.ToString(tEnd.Year()) + "" + toolkit.ToString(int(tEnd.Month()))

			if xString != endString {
				durationMonths++
				months = append(months, int(xDate.Month()))

				if (toolkit.ToString(xDate.Year()) + "" + toolkit.ToString(int(xDate.Month()))) == (toolkit.ToString(tStart.Year()) + "" + toolkit.ToString(int(tStart.Month()))) {
					monthDay.Set(toolkit.ToString(tStart.Year())+""+toolkit.ToString(int(tStart.Month())),
						toolkit.M{
							"days":         daysInYear.GetInt(toolkit.ToString(int(xDate.Month()))) - (int(tStart.Day()) - 1),
							"totalInMonth": daysInYear.GetInt(toolkit.ToString(int(xDate.Month()))),
						})
				} else {
					monthDay.Set(toolkit.ToString(xDate.Year())+""+toolkit.ToString(int(xDate.Month())),
						toolkit.M{
							"days":         daysInYear.GetInt(toolkit.ToString(int(xDate.Month()))),
							"totalInMonth": daysInYear.GetInt(toolkit.ToString(int(xDate.Month()))),
						})
				}

				month++
				if month > 12 {
					year = year + 1
					month = 1
					daysInYear = GetDayInYear(year)
				}

				xDate, _ = time.Parse("2006-1-2", toolkit.ToString(year)+"-"+toolkit.ToString(month)+"-"+toolkit.ToString(day))
			} else {
				durationMonths++
				months = append(months, int(tEnd.Month()))
				monthDay.Set(toolkit.ToString(tEnd.Year())+""+toolkit.ToString(int(tEnd.Month())), toolkit.M{
					"days":         int(tEnd.Day()),
					"totalInMonth": daysInYear.GetInt(toolkit.ToString(int(tEnd.Month()))),
				})
				break out
			}
		}
	}

	if durationMonths == 0 {
		months = append(months, int(tEnd.Month()))
		durationMonths = 1
		monthDay.Set(toolkit.ToString(tEnd.Year())+""+toolkit.ToString(int(tEnd.Month())), toolkit.M{
			"days":         int(tEnd.Day()) - (int(tStart.Day()) - 1),
			"totalInMonth": daysInYear.GetInt(toolkit.ToString(int(tEnd.Month()))),
		})
	}

	return durationMonths, months, monthDay
}

// add by ams, 2016-10-04 to handle filter value for predefine period eg. Last Month, Last 3 Months etc.
func GetLastDateData(r *knot.WebContext) (result time.Time) {
	iLastDateData := r.Session("lastdate_data")
	if iLastDateData != nil {
		result = iLastDateData.(time.Time)
	} else {
		result = time.Now().UTC()
	}

	return
}

// add by RS, 2016-10-26 to assign start date & end date based on period type
func GetStartEndDate(r *knot.WebContext, period string, tStart, tEnd time.Time) (startDate, endDate time.Time, err error) {
	currentDate := time.Now().UTC()
	if period == "custom" {
		if tStart.Year() > 2012 || tEnd.Year() > 2012 {
			startDate, _ = time.Parse("2006-01-02", tStart.UTC().Format("2006-01-02"))
			/*if tEnd.Truncate(24 * time.Hour).Equal(currentDate.Truncate(24 * time.Hour)) {
				endDate = currentDate
			} else {
				endDate, _ = time.Parse("2006-01-02 15:04:05", tEnd.UTC().Format("2006-01-02")+" 23:59:59")
			}*/
			endDate, _ = time.Parse("2006-01-02 15:04:05", tEnd.UTC().Format("2006-01-02")+" 23:59:59")
		} else {
			err = errors.New("Date Cannot be Less Than 2013")
		}
	} else {
		iLastDateData := GetLastDateData(r)
		/*jika memiliki custom date sendiri seperti wind rose yang max date nya 31 Juli 2016*/
		customLastDate := r.Session("custom_lastdate")

		if customLastDate != nil {
			iLastDateData = customLastDate.(time.Time)
		}
		endDate = iLastDateData
		/*jika tidak sama dengan tanggal hari ini maka set jam jadi 23:59:59*/
		if !iLastDateData.Truncate(24 * time.Hour).Equal(currentDate.Truncate(24 * time.Hour)) {
			endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23,
				59, 59, 0, time.UTC)
		}

		switch period {
		case "last24hours":
			startDate = endDate.Add(-24 * time.Hour)
		case "last7days":
			startDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day()-7, 0, 0, 0, 0, time.UTC)
		case "monthly":
			if tStart.Year() > 2012 || tEnd.Year() > 2012 {
				/*start date sudah tanggal 1 dari frontend*/
				startDate, _ = time.Parse("2006-01-02", tStart.UTC().Format("2006-01-02"))
				/*if (tEnd.Year() == currentDate.Year()) && (tEnd.Month() == currentDate.Month()) {
					endDate = currentDate
				} else {
					t := time.Date(tEnd.Year(), tEnd.Month()+1, 1, 0, 0, 0, 0, time.UTC)
					endDate = time.Date(tEnd.Year(), tEnd.Month(), t.Add(-24*time.Hour).Day(), 23, 59, 59, 0, time.UTC)
				}*/
				/*dari end date frontend ditambah 1 bulan trus dikurangi 1 hari untuk dapet max day di bulan tsb*/
				t := time.Date(tEnd.Year(), tEnd.Month()+1, 1, 0, 0, 0, 0, time.UTC)
				endDate = time.Date(tEnd.Year(), tEnd.Month(), t.Add(-24*time.Hour).Day(), 23, 59, 59, 0, time.UTC)
			} else {
				err = errors.New("Date Cannot be Less Than 2013")
			}
		case "annual":
			if tStart.Year() > 2012 || tEnd.Year() > 2012 {
				if tEnd.Year() != endDate.Year() {
					endDate = time.Date(tEnd.Year(), 12, 31, 23, 59, 59, 0, time.UTC)
				}
				startDate = time.Date(tStart.Year(), 1, 1, 0, 0, 0, 0, time.UTC)
			} else {
				err = errors.New("Date Cannot be Less Than 2013")
			}
		}
	}

	r.SetSession("custom_lastdate", nil)
	return
}

func GetProjectList() (result []string, e error) {
	csr, e := DB().Connection.NewQuery().From("ref_project").Cursor(nil)

	if e != nil {
		return
	}
	defer csr.Close()

	data := []toolkit.M{}
	e = csr.Fetch(&data, 0, false)

	for _, val := range data {
		if val.GetString("projectid") == "Tejuva" {
			result = append(result, val.GetString("projectid"))
		}
	}

	sort.Strings(result)
	return
}

func GetTurbineList() (result []string, e error) {
	csr, e := DB().Connection.NewQuery().From("ref_turbine").Cursor(nil)

	if e != nil {
		return
	}
	defer csr.Close()

	data := []toolkit.M{}
	e = csr.Fetch(&data, 0, false)

	for _, val := range data {
		result = append(result, val.GetString("turbineid"))
	}
	sort.Strings(result)

	return
}
