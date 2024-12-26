frappe.ui.form.on("Lead", {
  refresh(frm) {
    frm.set_df_property("naming_series", "hidden", 1);
    // frm.set_df_property('custom_panel_type_two',"hidden",1)
  },
  custom_pin_code: function (frm) {
    frm.set_value("custom_service_provider", "");

    if (frm.doc.custom_pin_code) {
      frappe.db
        .get_value("Pin Code", cur_frm.doc.custom_pin_code, "provider_id")
        .then((r) => {
          frm.set_query("custom_service_provider", function (doc) {
            return {
              filters: [
                ["Service Provider", "provider_id", "=", r.message.provider_id],
              ],
            };
          });
        });
    }
    calculate_kw(frm);
  },

  custom_panel_type: function (frm) {
    if (frm.doc.custom_panel_type && frm.doc.custom_solar_services) {
      get_watt_peak(frm);
    }
    if(frm.doc.custom_solar_services == "Residential"){
             filter_system_size(frm);

    }

  },
  custom_billing_cycle: function (frm) {
    calculate_kw(frm);
  },
  custom_electricity_bill: function (frm) {
    calculate_kw(frm);
  },
  custom_solar_services: function (frm) {
    frm.set_value('custom_panel_type','')
    calculate_kw(frm);
    if (frm.doc.custom_solar_services == "Residential") {
      frm.set_df_property("custom_subsidy", "options", [
        "With Subsidy",
        "Without Subsidy",
      ]);

      frm.set_query("custom_panel_type", function (doc) {
        return {
          filters: [["Panel Type", "is_residential_enabled", "=", 1]],
        };
      });
    } else if (frm.doc.custom_solar_services == "Industrial") {
      frm.set_df_property("custom_subsidy", "options", ["Without Subsidy"]);
      frm.set_value('custom_subsidy',"Without Subsidy")
      frm.set_df_property('custom_subsidy','read_only',1)
      frm.set_query("custom_panel_type", function (doc) {
        return {
          filters: [["Panel Type", "is_industrial_enabled", "=", 1]],
        };
      });
    }
  },
  custom_required_kw: function (frm) {
    if(frm.doc.custom_solar_services == "Residential"){
        filter_system_size(frm);
    }
    
    // if (frm.doc.custom_solar_services == "Residential") {
    //   console.log("cal panel count residential");
    //   cal_panel_count_res(frm);
    // } else if (frm.doc.custom_solar_services == "Industrial") {
    //   console.log("calculate panel count industrial");
    //   cal_panel_count_indus(frm);
    // }
    if(frm.doc.custom_solar_services == "Industrial"){
        cal_panel_count_indus(frm);
    }
  },
  custom_watt_peak_residential: function (frm) {
    // cal_panel_count_res(frm);
    if (frm.doc.custom_watt_peak_residential) {
      filter_company_res(frm);
    }
  },
  custom_watt_peak_industrial: function (frm) {
    cal_panel_count_indus(frm);
    cal_sys_size_indus(frm);
    if (frm.doc.custom_watt_peak_industrial) {
      filter_company_indus(frm);
    }
  },

  custom_panel_count_industrial: function (frm) {
    cal_sys_size_indus(frm);
  },
  custom_system_size_solar: function (frm) {
    if (frm.doc.custom_system_size_solar) {
        cal_panel_count_res(frm)
      frappe.db
        .get_value(
          "System Size",
          cur_frm.doc.custom_system_size_solar,
          "subsidy_amount"
        )
        .then((r) => {
          console.log(r);
          if (r.message.subsidy_amount) {
            frm.set_value("custom_subsidy_amount", r.message.subsidy_amount);
            frm.set_df_property('custom_subsidy_amount','read_only',1)
          }
        });
    }
    if (frm.doc.custom_subsidy == 'With Subsidy'){
     get_dcr_pricing(frm)
    }
  },
  custom_system_size_industrial:function(frm){
    get_ndcr_pricing(frm)


  },
  custom_solar_company:function(frm){
    if (frm.doc.custom_solar_services == "Industrial"){
        get_ndcr_pricing(frm)
    }
    else if(frm.doc.custom_solar_services =="Residential"){
        get_dcr_pricing(frm)
    }
  },
  after_save:function(frm){
    frappe.call({
      method: "skemi.custom_scripts.lead.lead.testFunction",
      callback: (r) => {
      },
    });
    
  }
});


function filter_system_size(frm) {
  if (frm.doc.custom_required_kw && frm.doc.custom_panel_type) {
    frappe.call({
      method: "skemi.custom_scripts.lead.lead.filter_system_size",
      args: {
        reqd_kw: cur_frm.doc.custom_required_kw,
        panel_type: cur_frm.doc.custom_panel_type,
      },
      callback: (r) => {
        frm.set_query("custom_system_size_solar", function (doc) {
          return {
            filters: [["System Size", "name", "in", r.message]],
          };
        });
      },
    });
  }
}

function calculate_kw(frm) {
  let unitPriceIndus;
  let unitPriceRes;
  let reqdKW;
  if (
    frm.doc.custom_billing_cycle &&
    frm.doc.custom_pin_code &&
    frm.doc.custom_electricity_bill &&
    frm.doc.custom_solar_services
  ) {
    frappe.db
      .get_value("Pin Code", cur_frm.doc.custom_pin_code, [
        "unit_price_residential",
        "unit_price_industrial",
      ])
      .then((r) => {
        unitPriceIndus = r.message.unit_price_industrial;
        unitPriceRes = r.message.unit_price_residential;
        electricityBill = cur_frm.doc.custom_electricity_bill;

        if (frm.doc.custom_billing_cycle == "1 Months") {
          if (frm.doc.custom_solar_services == "Residential") {
            reqdKW = cur_frm.doc.custom_electricity_bill / (unitPriceRes * 120);
            frm.set_value("custom_required_kw", reqdKW);
            console.log("reuired kilowayy", reqdKW);
          } else if (frm.doc.custom_solar_services == "Industrial") {
            reqdKW =
              cur_frm.doc.custom_electricity_bill / (unitPriceIndus * 120);
            frm.set_value("custom_required_kw", reqdKW);
            console.log("reuired kilowayy from industrial", reqdKW);
          }
        } else if (frm.doc.custom_billing_cycle == "2 Months") {
          if (frm.doc.custom_solar_services == "Residential") {
            reqdKW =
              cur_frm.doc.custom_electricity_bill / (unitPriceIndus * 240);
            frm.set_value("custom_required_kw", reqdKW);
            console.log("reuired kilowayy", reqdKW);
          } else if (frm.doc.custom_solar_services == "Industrial") {
            reqdKW = cur_frm.doc.custom_electricity_bill / (unitPriceRes * 240);
            frm.set_value("custom_required_kw", reqdKW);
            console.log("reuired kilowayy", reqdKW);
          }
        }
      });
  }
}

function cal_panel_count_res(frm) {
  if ( frm.doc.custom_watt_peak_residential && frm.doc.custom_required_kw) {
    frappe.db
    .get_value("Watt Peak", frm.doc.custom_watt_peak_residential, "watt_peak")
    .then((r) => {
      if (r.message.watt_peak > 0) {
        panel_count = Math.round(
          (frm.doc.custom_required_kw * 1000) / r.message.watt_peak
        );
        if (panel_count) {
          console.log("panel count residential", panel_count);
          frm.set_value("custom_panel_count_residential", panel_count);
          frm.set_df_property('custom_panel_count_residential','read_only',1)
        }
      }
    });
  }
}

function cal_panel_count_indus(frm) {
  console.log("cal indus", frm.doc.custom_watt_peak_industrial);
  if (frm.doc.custom_watt_peak_industrial && frm.doc.custom_required_kw) {
    frappe.db
      .get_value("Watt Peak", frm.doc.custom_watt_peak_industrial, "watt_peak")
      .then((r) => {
        if (r.message.watt_peak > 0) {
          panel_count = Math.round(
            (frm.doc.custom_required_kw * 1000) / r.message.watt_peak
          );
          if (panel_count) {
            console.log("panel count industrial", panel_count);
            frm.set_df_property("custom_panel_count_industrial", "options", [
              (panel_count - 2).toString(),
              (panel_count - 1).toString(),
              panel_count.toString(),
              (panel_count + 1).toString(),
              (panel_count + 2).toString(),
            ]);
            frm.set_value(
              "custom_panel_count_industrial",
              panel_count.toString()
            );
          }
        }
      });
    // panel_count=Math.round((frm.doc.custom_required_kw*1000)/)
    // if(panel_count){
    //     frm.set_df_property('custom_panel_count_industrial', 'options', [
    //         (panel_count + 2).toString(),
    //         (panel_count + 1).toString(),
    //         panel_count.toString(),
    //         (panel_count - 2).toString(),
    //         (panel_count - 1).toString()
    //     ]);

    // }
  }
}

function cal_sys_size_indus(frm) {
  if (
    frm.doc.custom_watt_peak_industrial &&
    frm.doc.custom_panel_count_industrial
  ) {
    if (frm.doc.custom_watt_peak_industrial) {
      frappe.db
        .get_value(
          "Watt Peak",
          frm.doc.custom_watt_peak_industrial,
          "watt_peak"
        )
        .then((r) => {
          let panel_count = parseInt(frm.doc.custom_panel_count_industrial, 10);
          let sys_size = (r.message.watt_peak * panel_count) / 1000;
          console.log("calculate system size", sys_size);
          frm.set_value("custom_system_size_industrial", sys_size);
        });
    }
  }
}

function filter_company_indus(frm) {
  if (frm.doc.custom_watt_peak_industrial) {
    frappe.call({
      method: "skemi.custom_scripts.lead.lead.filter_company",
      args: {
        watt_peak: cur_frm.doc.custom_watt_peak_industrial,
      },
      callback: (r) => {
        if (r.message) {
          console.log(r.message);
          frm.set_query("custom_solar_company", function (doc) {
            return {
              filters: [["Solar Company", "company_id", "in", r.message]],
            };
          });
        }
      },
    });
  }
}

function filter_company_res(frm) {
  if (frm.doc.custom_watt_peak_residential) {
    frappe.call({
      method: "skemi.custom_scripts.lead.lead.filter_company",
      args: {
        watt_peak: cur_frm.doc.custom_watt_peak_residential,
      },
      callback: (r) => {
        if (r.message) {
          console.log(r.message);
          frm.set_query("custom_solar_company", function (doc) {
            return {
              filters: [["Solar Company", "company_id", "in", r.message]],
            };
          });
        }
      },
    });
  }
}


function get_watt_peak(frm) {
  frappe.call({
    method: "skemi.custom_scripts.lead.lead.get_watt_peak",
    args: {
      service: cur_frm.doc.custom_solar_services,
      panel_type: cur_frm.doc.custom_panel_type,
    },
    callback: (r) => {
      console.log(r.message);
      if (frm.doc.custom_solar_services == "Residential") {
        console.log(r.message[0].name);
        frm.set_value("custom_watt_peak_residential", r.message[0].name);
        // frm.set_df_property("custom_watt_peak_residential",'read_only',1)
      } else if (frm.doc.custom_solar_services == "Industrial") {
        frm.set_value("custom_watt_peak_industrial", r.message[0].name);
      }
    },
  });
}
// get the price for industrial
function get_ndcr_pricing(frm){
    if(frm.doc.custom_solar_company && frm.doc.custom_panel_type && frm.doc.custom_system_size_industrial){
        data={
            solar_company:frm.doc.custom_solar_company,
            panel_type:frm.doc.custom_panel_type,
            sys_size:frm.doc.custom_system_size_industrial,
        }
        frappe.call({
            method: "skemi.custom_scripts.lead.lead.get_ndcr_pricing",
            args: {
             data:data
            },
            callback: (r) => {
                if(r.message){
                    console.log(r.message.price)
                    let indusSubsidyEffectiveAmount=(r.message[0].price*frm.doc.custom_system_size_industrial)
                    frm.set_value('custom_subsidy_effective_amount_industrial',indusSubsidyEffectiveAmount)
                    frm.set_df_property('custom_subsidy_effective_amount_industrial','read_only',1)

                }
            },
          });
    }
}

// get the price for residential
function get_dcr_pricing(frm){
    if(frm.doc.custom_solar_company && frm.doc.custom_panel_type && frm.doc.custom_system_size_solar){
        data={
            solar_company:frm.doc.custom_solar_company,
            panel_type:frm.doc.custom_panel_type,
            sys_size:frm.doc.custom_system_size_solar,
        }
    
        frappe.call({
            method: "skemi.custom_scripts.lead.lead.get_dcr_pricing",
            args: {
             data:data
            },
            callback: (r) => {
                console.log('dcr price res',r)
                if(r.message){
                    console.log(r)
                    let subsidyEffectiveAmount=(parseFloat(r.message[0].price)-parseFloat(frm.doc.custom_subsidy_amount))
                    frm.set_value('custom_subsidy_effective_amount',subsidyEffectiveAmount)
                    frm.set_df_property('custom_subsidy_effective_amount','read_only',1)
                }
    
            },
          });

    }


}



