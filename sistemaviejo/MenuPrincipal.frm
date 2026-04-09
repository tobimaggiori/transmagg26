VERSION 5.00
Begin VB.MDIForm MenuPrincipal 
   BackColor       =   &H8000000C&
   Caption         =   "MenuPrincipal"
   ClientHeight    =   6045
   ClientLeft      =   225
   ClientTop       =   855
   ClientWidth     =   9735
   LinkTopic       =   "MDIForm1"
   StartUpPosition =   3  'Windows Default
   WindowState     =   2  'Maximized
   Begin VB.Menu mnABM 
      Caption         =   "ABM"
      Begin VB.Menu mnABMFleteros 
         Caption         =   "Fleteros"
      End
      Begin VB.Menu mnChoferes 
         Caption         =   "Choferes"
      End
      Begin VB.Menu mnABMEmpresas 
         Caption         =   "Empresas"
      End
      Begin VB.Menu mnPlanCtas 
         Caption         =   "Plan de Ctas"
      End
      Begin VB.Menu mnProvincias 
         Caption         =   "ABM Provincias"
      End
      Begin VB.Menu mnCCompras 
         Caption         =   "ABM Conceptos Compras"
      End
      Begin VB.Menu mnParametros 
         Caption         =   "ABM Parametros Sistema"
      End
      Begin VB.Menu mnComprobantes 
         Caption         =   "ABM Comprobante"
      End
      Begin VB.Menu ABMGenerarCAE 
         Caption         =   "Generar CAE"
      End
   End
   Begin VB.Menu mnFleteros 
      Caption         =   "Fleteros"
      Begin VB.Menu mnLiquidaciones 
         Caption         =   "Ing Liquidaciones"
      End
      Begin VB.Menu mnCtaLP 
         Caption         =   "Cta de Vta y Liquido Producto"
         Begin VB.Menu mnCtaLiqProd 
            Caption         =   "Nuevo"
         End
         Begin VB.Menu mnReimprime_LP 
            Caption         =   "Reimprimir"
         End
      End
      Begin VB.Menu mnRFact 
         Caption         =   "Reg.Facturas"
         Begin VB.Menu mnRegFact 
            Caption         =   "Fleteros"
         End
         Begin VB.Menu mnFactProv 
            Caption         =   "Proveedores"
         End
      End
      Begin VB.Menu mnLProducto 
         Caption         =   "Liquido Producto"
      End
      Begin VB.Menu mnliqprod1 
         Caption         =   "Liquido Producto - Reingresar"
      End
      Begin VB.Menu mnOPag 
         Caption         =   "Orden de Pago"
         Begin VB.Menu nmNOrdenPago 
            Caption         =   "Nueva Orden PAgo"
         End
         Begin VB.Menu mnOPago 
            Caption         =   "Orden Pago"
         End
         Begin VB.Menu mnReImpOP 
            Caption         =   "ReImprimir OP"
         End
      End
      Begin VB.Menu mnAplicComp 
         Caption         =   "Aplicar Comprobante"
      End
      Begin VB.Menu MenuAdelantos 
         Caption         =   "Adelantos"
         Begin VB.Menu MAdelantos 
            Caption         =   "Nuevos"
         End
         Begin VB.Menu mnRImpAdel 
            Caption         =   "Re Imprimir"
         End
      End
      Begin VB.Menu mnConsFlet 
         Caption         =   "Consultas"
         Begin VB.Menu mnLiqPend 
            Caption         =   "Liquidaciones Pendientes"
         End
         Begin VB.Menu mnCtaCteFlet 
            Caption         =   "Cuenta Corriente"
         End
         Begin VB.Menu mnCILP 
            Caption         =   "Cons. y Impresión L.P."
         End
         Begin VB.Menu mnIVACompras 
            Caption         =   "IVA Compras"
         End
         Begin VB.Menu infChofres 
            Caption         =   "Informe de Choferes"
         End
      End
   End
   Begin VB.Menu mnEmpresas 
      Caption         =   "Empresas"
      Begin VB.Menu Facturar 
         Caption         =   "Facturar"
         Begin VB.Menu mnfactviajes 
            Caption         =   "Facturas TRANS-MAGG"
         End
         Begin VB.Menu mnfactviajes1 
            Caption         =   "Facturas TRANS-MAGG - Reingresar"
         End
         Begin VB.Menu FactCtayOrden 
            Caption         =   "Fact. Cta y Orden"
         End
         Begin VB.Menu mnReFactCtaOrd 
            Caption         =   "ReImp Fact Cta y Orden"
         End
         Begin VB.Menu mnAplicCompEmp 
            Caption         =   "Aplicar Comp Emp"
         End
         Begin VB.Menu mnNC 
            Caption         =   "Notas de Credito"
         End
         Begin VB.Menu mnNotasCredito1 
            Caption         =   "Notas de Credito - Reingresar"
         End
         Begin VB.Menu mnND 
            Caption         =   "Nota de Debito"
         End
         Begin VB.Menu ImprimeNC 
            Caption         =   "Re Imprimir NC"
         End
         Begin VB.Menu mnImprimeFE 
            Caption         =   "Re imprime Comp Electronicos"
         End
         Begin VB.Menu mnFactViejas 
            Caption         =   "Imprime Facturas Viejas"
         End
         Begin VB.Menu mnModTarifa 
            Caption         =   "Modificar Tarifa"
         End
         Begin VB.Menu mnUltAuto 
            Caption         =   "Consulta Ultimo Autorizado"
         End
      End
      Begin VB.Menu mnRec 
         Caption         =   "Recibos "
         Begin VB.Menu mnRecCob 
            Caption         =   "Nuevo"
         End
         Begin VB.Menu mnRImpRec 
            Caption         =   "Re-Imprimir"
         End
      End
      Begin VB.Menu mnConsEmpresa 
         Caption         =   "Consultas"
         Begin VB.Menu MnViajesProv 
            Caption         =   "Viajes Por Provincias"
         End
         Begin VB.Menu mnViajes_SFacturar 
            Caption         =   "Viajes Sin Facturar"
         End
         Begin VB.Menu mnViajeFlet 
            Caption         =   "Viajes por Flet"
         End
         Begin VB.Menu mnCtaCteEmp 
            Caption         =   "Cuenta Corriente"
         End
         Begin VB.Menu mnRImpFact 
            Caption         =   "Consulta y Re-Impresión de Fact"
         End
         Begin VB.Menu mnDetDesc 
            Caption         =   "Detalle de Descuentos"
         End
         Begin VB.Menu mnIVAVentas 
            Caption         =   "IVA Ventas"
         End
         Begin VB.Menu mnConsSaldoEmp 
            Caption         =   "Consulta de Saldos"
         End
         Begin VB.Menu mnHistoricos 
            Caption         =   "Consulta Saldo Historicos"
         End
         Begin VB.Menu mnSaldoCero 
            Caption         =   "Saldo Cero"
         End
      End
      Begin VB.Menu mnMutuo 
         Caption         =   "Mutuo Cheques"
      End
   End
   Begin VB.Menu mnBancos 
      Caption         =   "Bancos"
      Begin VB.Menu mnIngMov 
         Caption         =   "Ingreso de Movimientos"
      End
      Begin VB.Menu mnAcredCh 
         Caption         =   "Acreditar Cheques"
      End
      Begin VB.Menu mnConsCtaCte 
         Caption         =   "Consulta Cta Cte"
      End
      Begin VB.Menu mnConsCHTer 
         Caption         =   "Cons CH Terc"
      End
      Begin VB.Menu ConsCHEmitidos 
         Caption         =   "Consulta Ch Emitidos"
      End
      Begin VB.Menu IngCHCar 
         Caption         =   "Ing Ch en Cartera"
      End
      Begin VB.Menu mnConciliacion 
         Caption         =   "Conciliacion"
      End
   End
   Begin VB.Menu mnbackup 
      Caption         =   "Backup"
   End
   Begin VB.Menu mnsalir 
      Caption         =   "Salir"
   End
End
Attribute VB_Name = "MenuPrincipal"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub ABMGenerarCAE_Click()
With GeneraCAE
    .Show
    .Height = 5220
    .Width = 13140
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub ConsCHEmitidos_Click()
With ConsultaCH
    .Show
    .Height = 2385
    .Width = 5085
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub FactCtayOrden_Click()
With FactxCta
    .Show
    .Height = 10680
    .Width = 13125
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub ImprimeNC_Click()
With ReImpNC
    .Show
    .Height = 2415
    .Width = 4755
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub IngCHCartera_Click()

End Sub

Private Sub infChofres_Click()
With InfListadoChoferes
    .Show
    .Height = 2865
    .Width = 4800
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub IngCHCar_Click()
With IngCHCartera
    .Show
    .Height = 2790
    .Width = 7785
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub MAdelantos_Click()
With Adelantos
    .Show
    .Height = 10635
    .Width = 9735
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub MDIForm_Load()
Dim Compartida As Boolean
Compartida = False
'configura la configuracion regional
    Call SetLocaleInfo(GetSystemDefaultLCID(), LOCALE_SDECIMAL, ".")
    Call SetLocaleInfo(GetSystemDefaultLCID(), LOCALE_SLIST, ",")
    Call SetLocaleInfo(GetSystemDefaultLCID(), LOCALE_SMONDECIMALSEP, ".")
    Call SetLocaleInfo(GetSystemDefaultLCID(), LOCALE_SMONTHOUSANDSEP, ",")
    Call SetLocaleInfo(GetSystemDefaultLCID(), LOCALE_STHOUSAND, ",")
Dim sDBName As String, sDBNameTemp As String
    ' obtiene la ruta de acceso y el nombre de la base de datos usada en
    ' el proyecto por medio del mçodulo ReadINI
    sDBName = DBPath
    sDBNameTemp = DBPathTemp
    
    ' abre la base de datos y el recordset
    Set db = DBEngine.Workspaces(0).OpenDatabase(sDBName)
    Set dbTemp = DBEngine.Workspaces(0).OpenDatabase(sDBNameTemp)
With Identificacion
    .Show
    .Height = 6255
    .Width = 5190
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnABMEmpresas_Click()
With ABMEmpresas
    .Show
    .Height = 4980
    .Width = 10200
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnABMFleteros_Click()
With ABMFleteros
    .Show
    .Height = 5775
    .Width = 10200
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnAcredCh_Click()
With AcreditaCH
    .Show
    .Height = 8520
    .Width = 8055
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnAplicComp_Click()
With AplicOP
    .Show
    .Height = 7470
    .Width = 10935
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnAplicCompEmp_Click()
With AplicComprobantes
    .Show
    .Height = 9315
    .Width = 14340
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnbackup_Click()
With Backup
    .Show
    .Height = 4890
    .Width = 5985
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnCCompras_Click()
With ABMConCompras
    .Show
    .Height = 2790
    .Width = 6225
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnComprobantes_Click()
With AnulaFact
    .Show
    .Height = 9000
    .Width = 13000
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnConciliacion_Click()
With ConciliacionBancaria
    .Show
    .Height = 8190
    .Width = 13005
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnConsCHTer_Click()
With ConsChequesTer
    .Show
    .Height = 6315
    .Width = 8865
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnConsCtaCte_Click()
With ConsCtaCteBco
    .Show
    .Height = 5925
    .Width = 14550
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnConsSaldoEmp_Click()
With SaldosEmpresas
    .Show
    .Height = 6000
    .Width = 9150
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnChoferes_Click()
With ABMChoferes
    .Show
    .Height = 6105
    .Width = 12120
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnCILP_Click()
With ReImpLP
    .Show
    .Height = 3435
    .Width = 3945
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnCtaCteEmp_Click()
With ConsCtaCteEmp
    .Show
    .Height = 5925
    .Width = 11460
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnCtaCteFlet_Click()
With ConsCtaCteFlet
    .Show
    .Height = 5925
    .Width = 11460
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnFactNCND_Click()
FactNCND.Show
End Sub

Private Sub mnCtaLiqProd_Click()
With LiqProducto
    .Show
    .Height = 8835
    .Width = 12235
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With


End Sub

Private Sub mnDetDesc_Click()
With DetDesc
    .Show
    .Height = 2280
    .Width = 5835
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With


End Sub

Private Sub mnFactElectronica_Click()
With FactElect
    .Show
    .Height = 6510
    .Width = 7065
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With


End Sub

Private Sub mnFactProv_Click()
With FactProv
    .Show
    .Height = 6780
    .Width = 8760
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnFactViajes_Click()
With FacturarViajes
    .Show
    .Height = 10680
    .Width = 14325
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnfactviajes1_Click()
With FacturarViajes1
    .Show
    .Height = 10680
    .Width = 14325
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnFactViejas_Click()
With ReeImpFact
    .Show
    .Height = 2775
    .Width = 4860
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnHistoricos_Click()
With ConsSaldoHistoricos
    .Show
    .Height = 2595
    .Width = 4410
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnImprimeFE_Click()
With ReImprimeFE
    .Show
    .Height = 2775
    .Width = 4860
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With


End Sub

Private Sub mnIngMov_Click()
With IngMovBanco
    .Show
    .Height = 8235
    .Width = 8535
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnIVACompras_Click()
With IVACompras
    .Show
    .Height = 4635
    .Width = 5685
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnIVAVentas_Click()
With IVAVentas
    .Show
    .Height = 5025
    .Width = 5805
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnLiqPend_Click()
With ConsLiqPend
    .Show
    .Height = 3450
    .Width = 9015
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnliqprod1_Click()
With LiqProducto1
    .Show
    .Height = 10785
    .Width = 13605
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnLiquidaciones_Click()
With Liquidaciones
    .Show
    .Height = 8745
    .Width = 12495
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnLProducto_Click()
With LiquidoProducto
    .Show
    .Height = 10785
    .Width = 13605
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnModTarifa_Click()
With ModificaTarifa
    .Show
    .Height = 5490
    .Width = 13125
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnMutuo_Click()
With CambCh
    .Show
    .Height = 7635
    .Width = 12900
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnNC_Click()
With NotasCredito
    .Show
    .Height = 6900
    .Width = 8130
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnND_Click()
With NotaDebito
    .Show
    .Height = 6330
    .Width = 8220
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnNotasCredito1_Click()
With NotasCredito1
    .Show
    .Height = 6900
    .Width = 8130
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnOPago_Click()
With OrdenPago
    .Show
    .Height = 10635
    .Width = 9735
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnParametros_Click()
With ABMParametros
    .Show
    .Height = 3120
    .Width = 6240
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnPlanCtas_Click()
With ABMPlanCtas
    .Show
    .Height = 5460
    .Width = 6585
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnProvincias_Click()
With ABMProvincias
    .Show
    .Height = 2790
    .Width = 6225
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnRecCob_Click()
With RecCob
    .Show
    .Height = 8670
    .Width = 9660
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnReFactCtaOrd_Click()
With ReImpFO
    .Show
    .Height = 2070
    .Width = 4530
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnRegFact_Click()
With RegFactProv
    .Show
    .Height = 8220
    .Width = 9990
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnReImpOP_Click()
With RImp_NOPago
    .Show
    .Height = 3105
    .Width = 6120
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
    '.NroFact = VNro
    '.NroLP = lPrimaryKey
    '.Text1 = vflet
End With

'With ReImpOP
'    .Show
'    .Height = 2160
'    .Width = 3840
'    .Top = (Screen.Height - .Height) / 2 - 600
'    .Left = (Screen.Width - .Width) / 2
'End With
End Sub

Private Sub mnReimprime_LP_Click()
With Reimprime_LP
        .Show
        .Height = 3105
        .Width = 6120
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2

    End With

End Sub

Private Sub mnRImpAdel_Click()
With ReImpAdelanto
        .Show
        .Height = 3105
        .Width = 6120
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2

    End With

End Sub

Private Sub mnRImpFact_Click()
With ReeImpFact
    .Show
    .Height = 2415
    .Width = 4755
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnRImpRec_Click()
With ReImpRec
    .Show
    .Height = 1950
    .Width = 3690
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnSaldoCero_Click()
With SaldoCero
    .Show
    .Height = 2580
    .Width = 4800
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnsalir_Click()
End
End Sub

Private Sub mnUltAuto_Click()
With ConsUltAuto
    .Show
    .Height = 3405
    .Width = 4920
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnViajeFlet_Click()
With Det_Viajes
    .Show
    .Height = 2850
    .Width = 6780
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnViajes_SFacturar_Click()
With ConsViajesPend
    .Show
    .Height = 3450
    .Width = 9015
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub MnViajesProv_Click()
With ConsViajesProv
    .Show
    .Height = 2850
    .Width = 6780
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub nmNOrdenPago_Click()
With NuevaOrdenPago
    .Show
    .Height = 10125
    .Width = 16020
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub
