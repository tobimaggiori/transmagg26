Attribute VB_Name = "ReadINI"
    Option Explicit
Public db As Database
Public dbTemp As Database
Public rs As Recordset
Public Items As Long
Public rsAsientos As Recordset
Public rsSituacionIVA As Recordset
Public rsFleteros As Recordset
Public rsChoferes As Recordset
Public rsEmpresas As Recordset
Public rsEncabLiq As Recordset, TrsEncabLiq As Recordset
Public rsLiqDetViajes As Recordset, TrsLiqDetViajes As Recordset
Public rsLiqDetDesc As Recordset, TrsLiqDetDesc As Recordset
Public rsEncabFact As Recordset, rsDetFact As Recordset, TrsEncabFact As Recordset, TrsDetFact As Recordset
Public rsPlanCtas As Recordset
Public rsProvincias As Recordset
Public rsEncabFactProv As Recordset, rsDetFactProv As Recordset, rsCtaCteProv As Recordset
Public rsConceptoCompras As Recordset
Public rsFactProv_Liq As Recordset
Public rsComprobantes As Recordset
Public rsParametros As Recordset
Public rsCtaBcoPropias As Recordset
Public rsCtaCteBco As Recordset
Public rsEncabLP As Recordset
Public rsDetLPCH_P As Recordset
Public rsViajes_SFact As Recordset
Public rsLiqPend As Recordset
Public rsCtaCteEmp As Recordset
Public rsBcos As Recordset
Public rsConcRec As Recordset
Public rsEncabRec As Recordset
Public rsChTer As Recordset
Public rsRecOtros As Recordset
Public rsAplicRec As Recordset
Public rsDetLPCHTer As Recordset
Public rsConFact As Recordset
Public rsAplicOP As Recordset
Public rsEncabOP As Recordset
Public rsDetOPCHT As Recordset
Public rsDetOPCHP As Recordset
Public rsCHEmitidos As Recordset
Public TrsDescDet As Recordset
Public TrsIVAVentas As Recordset
Public TrsConsultas As Recordset
Public TrsConsCtaCte As Recordset
Public rsTSaldoVentas As Recordset
Public rsEncabFactCta As Recordset
Public rsDetFactCta As Recordset
Public rsGasOilFleteros As Recordset
Public Accion As String
Public VNroViaje As Double
Public Criterio As String
Public TViajesNeto As Double
Public TRetIIBB As Double
Public TIVAViajes As Double
Public TViajes As Double
Public TIVAComis As Double
Public TComis As Double
Public TComisNeta As Double
Public TDescuentos As Double, TPagar As Double, TVAsignado As Double
Public TFact As Double, TIVAFact As Double, TNetoFact As Double
Public Lista As ListItem, LDetViajes As ListItem, LDetDesc As ListItem, LVAsignado As ListItem, FactPend As ListItem, FactAplic As ListItem
Public LEmpresas As ListItem, Viene As String


Public Function DBPath() As String
    DBPath = App.Path + "\BaseDatos\BD_JAVIER.mdb"
End Function
Public Function DBPathTemp() As String
    DBPathTemp = App.Path + "\BaseDatos\BASEDATOS_TEMP.mdb"
End Function

Public Function GetIniPath() As String
    GetIniPath = "C:\Windows\System"
End Function

Public Function GetWorkgroupDatabase() As String
    GetWorkgroupDatabase = "C:\Windows\System\system.mdw"
End Function


