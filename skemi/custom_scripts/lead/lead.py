import frappe
import json

@frappe.whitelist()
def filter_system_size(reqd_kw,panel_type):
    filtered_system_size=[]
    panel_id=frappe.db.get_value("Panel Type",panel_type, 'panel_type_id', as_dict=1)
    panel_type_id=panel_id['panel_type_id']

   # system size greater
    list_greater = frappe.db.get_all(
        'System Size',
        filters=[
        {'system_size': ['>', reqd_kw]},
        {'panel_id': panel_type_id}         
    ],
        fields=['system_size','panel_id','name'],
        order_by = 'system_size asc'
    )
    frappe.msgprint(repr(list_greater))
    if len(list_greater) > 0:
        greater=list_greater[0]['name']
        filtered_system_size.append(greater)

    # system size lesser

    list_lesser = frappe.db.get_all(
        'System Size',
        filters=[
            {'system_size': ['<',reqd_kw]},
            {'panel_id':panel_type_id}
        ],
        fields=['system_size','panel_id','name'],
        order_by='system_size desc' 
    )
    frappe.msgprint(repr(list_lesser))
    if len(list_lesser) > 0:
        lesser=list_lesser[0]['name']
        filtered_system_size.append(lesser)


    # system size equal

    list_equal=frappe.db.get_all(
        'System Size',
        filters=[
            {'system_size':reqd_kw},
            {'panel_id':panel_type_id}
        ],
        fields=['system_size','panel_id','name']  
    )
    frappe.msgprint('from equal')
    frappe.msgprint(repr(list_equal))
    if len(list_equal) > 0:
        equal=list_equal[0]['name']
        filtered_system_size.append(equal)
    
    frappe.msgprint('final list')
    frappe.msgprint(repr(filtered_system_size))
    frappe.response.message=filtered_system_size


@frappe.whitelist()
def get_watt_peak(service, panel_type):
    if service == 'Residential':
        watt_peak_id = frappe.db.get_value("Panel Type", panel_type, 'residential_default_watt_peak')
        if watt_peak_id:  # Ensure watt_peak_id is not None
            watt_peak = frappe.db.get_all(
                'Watt Peak',
                filters={'watt_peak_id': watt_peak_id},
                fields=['watt_peak','name']
            )
            # frappe.msgprint(repr(watt_peak))
            frappe.response.message=watt_peak
    elif service == "Industrial":
        watt_peak_id = frappe.db.get_value("Panel Type", panel_type, 'industrial_default_watt_peak')
        if watt_peak_id:  # Ensure watt_peak_id is not None
            watt_peak = frappe.db.get_all(
                'Watt Peak',
                filters={'watt_peak_id': watt_peak_id},
                fields=['watt_peak','name']
            )
            # frappe.msgprint(repr(watt_peak))
            frappe.response.message=watt_peak



@frappe.whitelist()
def filter_company(watt_peak):
    # frappe.msgprint(repr(watt_peak))
    filtered_company_list=[]
    watt_peak_id = frappe.db.get_value("Watt Peak", watt_peak, 'watt_peak_id')
    # get watt peak attriubutes based on the watt peak id
    if watt_peak_id:
        watt_peak_attr_list=frappe.db.get_all(
        'Watt Peak Attributes',
        filters={'custom_watt_peak_id': watt_peak_id},
        fields=['custom_company_id'] )
        # frappe.msgprint(repr(watt_peak_attr_list))
        for item in watt_peak_attr_list:
            filtered_company_list.append(item['custom_company_id'])
    frappe.response.message=filtered_company_list



@frappe.whitelist()
def get_ndcr_pricing(data):
    # frappe.msgprint(repr('hello'))
    # data=json.loads(data)
    data=json.loads(data)
    solar_company=data.get('solar_company')
    panel_type=data.get('panel_type')
    sys_size=data.get('sys_size')

    company_id=frappe.db.get_value("Solar Company", solar_company, 'company_id')
    panel_id=frappe.db.get_value('Panel Type',panel_type,'panel_type_id')

    price=frappe.db.get_list('Ndcr Pricing', 
    filters=[
        {'max_system_size': ['>', sys_size]},
        {'min_system_size':['<',sys_size]},
        {'panel_type_id':['=',panel_id]},
        {'company_id':['=',company_id]}
        ],
        fields=['price']
        )
    frappe.msgprint(repr(price))
    frappe.response.message=price


    



# getting the pricing from dcr pricing table based on the filter company id panel id and custom system size id
@frappe.whitelist()
def get_dcr_pricing(data):
    data=json.loads(data)
    solar_company=data.get('solar_company')
    panel_type=data.get('panel_type')
    sys_size=data.get('sys_size')
    

    company_id=frappe.db.get_value("Solar Company", solar_company, 'company_id')
    panel_id=frappe.db.get_value('Panel Type',panel_type,'panel_type_id')
    sys_id=frappe.db.get_value('System Size',sys_size,'custom_system_size_id')
    # frappe.msgprint(repr(company_id))
    # frappe.msgprint(repr(panel_id))
    # frappe.msgprint(repr(sys_id))
    price=frappe.db.get_list('Dcr Pricing', 
    filters=[
        {'system_size_id': ['=', sys_id]},
        {'panel_type_id':['=',panel_id]},
        {'company_id':['=',company_id]}
        ],
        fields=['price']
        )
   
    frappe.msgprint(repr(price))
    frappe.response.message=price

# @frappe.whitelist()
# def testFunction():
#     record=frappe.db.get_list('Employee',fields=['first_name'])
#     frappe.msgprint(repr(record))




    

       

    


