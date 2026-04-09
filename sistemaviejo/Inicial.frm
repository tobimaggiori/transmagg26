VERSION 5.00
Begin VB.MDIForm Inicial 
   BackColor       =   &H8000000C&
   Caption         =   "Menu Principal - JAVIER MAGGIORI"
   ClientHeight    =   8595
   ClientLeft      =   165
   ClientTop       =   825
   ClientWidth     =   10875
   LinkTopic       =   "MDIForm1"
   Picture         =   "Inicial.frx":0000
   StartUpPosition =   3  'Windows Default
   WindowState     =   2  'Maximized
   Begin VB.Menu mnABM 
      Caption         =   "ABM"
      Begin VB.Menu mnABMEmpresas 
         Caption         =   "Empresas"
      End
      Begin VB.Menu mnABMProveedores 
         Caption         =   "Proveedores"
      End
   End
   Begin VB.Menu mnEmpresas 
      Caption         =   "Empresas"
      Begin VB.Menu mnFactEmpresas 
         Caption         =   "Facturar"
         Begin VB.Menu mnNuevaFact 
            Caption         =   "Nueva"
         End
         Begin VB.Menu mnRImprirFact 
            Caption         =   "Re Imprimir"
         End
      End
      Begin VB.Menu mnRecCob 
         Caption         =   "Recibo Cobranza"
         Begin VB.Menu mnRCobranza 
            Caption         =   "Nuevo"
         End
         Begin VB.Menu mnRImpRec 
            Caption         =   "Re Imprimir"
         End
      End
      Begin VB.Menu mnConsCtaCte 
         Caption         =   "Cons Cta Cte"
      End
      Begin VB.Menu mnIVAVtas 
         Caption         =   "IVA Ventas"
      End
   End
   Begin VB.Menu mnProveedores 
      Caption         =   "Proveedores"
      Begin VB.Menu mnRegFact 
         Caption         =   "Registrar Facturas"
      End
      Begin VB.Menu mnOrdenPago 
         Caption         =   "Orden de Pago"
      End
      Begin VB.Menu mnConsCtaCteProv 
         Caption         =   "Consulta Cta Cte"
      End
      Begin VB.Menu mnIVACompras 
         Caption         =   "IVA Compras"
      End
   End
   Begin VB.Menu mnbcos 
      Caption         =   "Bancos"
      Begin VB.Menu mnIngMovBcos 
         Caption         =   "Ingresos de Movimientos"
      End
      Begin VB.Menu mnAcredCh 
         Caption         =   "Acreditacion de Cheques"
      End
      Begin VB.Menu mnConsCheTer 
         Caption         =   "Cons. Cheques Terc"
      End
      Begin VB.Menu mnResCta 
         Caption         =   "Resumen de Cta"
      End
   End
   Begin VB.Menu mnback 
      Caption         =   "Backup"
   End
End
Attribute VB_Name = "Inicial"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub MDIForm_Load()
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
'icture1.Height = Inicial.Height
'Picture1.Width = Inicial.Width

End Sub



Private Sub mnABMEmpresas_Click()
With ABMEmpresas
    .Show
    .Height = 4905
    .Width = 7740
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnABMProveedores_Click()
With ABMProveedores
    .Show
    .Height = 4305
    .Width = 7710
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnAcredCh_Click()
With AcreditaCH
    .Show
    .Height = 8070
    .Width = 8055
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnback_Click()
With Backup
    .Show
    .Height = 3855
    .Width = 3795
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnConsCheTer_Click()
With ConsChequesTer
    .Show
    .Height = 6255
    .Width = 8865
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnConsCtaCte_Click()
With ConsCtaCte
    .Show
    .Height = 6375
    .Width = 11355
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnConsCtaCteProv_Click()
With ConsCtaCteFlet
    .Show
    .Height = 5895
    .Width = 11460
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnIngMovBcos_Click()
With IngMovBanco
    .Show
    .Height = 8820
    .Width = 8160
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnIVACompras_Click()
With IVACompras
    .Show
    .Height = 2865
    .Width = 5520
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnIVAVtas_Click()
With IVAVentas
    .Show
    .Height = 3075
    .Width = 5685
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnNuevaFact_Click()
With FactEmpresas
    .Show
    .Height = 8625
    .Width = 9765
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub

Private Sub mnOrdenPago_Click()
With OrdenPago
    .Show
    .Height = 10230
    .Width = 9150
    .Top = (Screen.Height - .Height) / 20
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnRCobranza_Click()
With RecCobranza
    .Show
    .Height = 8205
    .Width = 9480
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnRegFact_Click()
With FactProv
    .Show
    .Height = 6375
    .Width = 8520
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnResCta_Click()
With ConsCtaCteBco
    .Show
    .Height = 5685
    .Width = 13815
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnRImpRec_Click()
With ReImpRec
    .Show
    .Height = 1980
    .Width = 3960
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
End Sub

Private Sub mnRImprirFact_Click()
With RImprirFactura
    .Show
    .Height = 1695
    .Width = 3825
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With

End Sub


