VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form ConsLiquidaciones 
   BackColor       =   &H80000007&
   Caption         =   "Consulta Liquidaciones"
   ClientHeight    =   4425
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   8115
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   4425
   ScaleWidth      =   8115
   Begin MSComctlLib.ListView ListLiquidaciones 
      Height          =   3015
      Left            =   120
      TabIndex        =   3
      Top             =   600
      Width           =   7800
      _ExtentX        =   13758
      _ExtentY        =   5318
      View            =   3
      LabelWrap       =   0   'False
      HideSelection   =   0   'False
      FullRowSelect   =   -1  'True
      _Version        =   393217
      ForeColor       =   -2147483640
      BackColor       =   -2147483643
      BorderStyle     =   1
      Appearance      =   1
      NumItems        =   6
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Nro Liq"
         Object.Width           =   1411
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "Fecha"
         Object.Width           =   1764
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "Total Viajes"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Total Comision"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   4
         Text            =   "Total Desc"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   5
         Text            =   "Total Pagar"
         Object.Width           =   2540
      EndProperty
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   1800
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   120
      Width           =   6135
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   840
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   120
      Width           =   855
   End
   Begin KewlButtonz.KewlButtons Seleccionar 
      Height          =   495
      Left            =   3000
      TabIndex        =   4
      Top             =   3840
      Width           =   2055
      _ExtentX        =   3625
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Seleccionar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   14737632
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ConsLiquidaciones.frx":0000
      PICN            =   "ConsLiquidaciones.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label3 
      BackColor       =   &H00000000&
      Caption         =   "Fletero"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Left            =   0
      TabIndex        =   0
      Top             =   120
      Width           =   1455
   End
End
Attribute VB_Name = "ConsLiquidaciones"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Buscar()
With BuscFlet
    .Show
    .Height = 6015
    .Width = 6225
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
    .Viene = "ConsLiq"
End With
End Sub
Private Sub Form_Initialize()
Set rsEncabLiq = Nothing
Set rsEncabLiq = Nothing
End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
Case vbKeyF3: Call Buscar
End Select

End Sub

Private Sub Form_Load()
Items = 0
Text1(0) = ""
Text1(1) = ""
ListLiquidaciones.ListItems.Clear
End Sub

Private Sub Seleccionar_Click()
On Error Resume Next
Liquidaciones.ListaViajes.ListItems.Clear
Liquidaciones.ListDescuentos.ListItems.Clear
Set Lista = ListLiquidaciones.ListItems.Item(ListLiquidaciones.SelectedItem.Index)
Set rsEncabLiq = db.OpenRecordset("Select * from EncabLiquidacion Where NroLiq = " & Lista.Tag & "", 2)
Liquidaciones.Text1(0) = rsEncabLiq!CodFlet
Set rsFleteros = db.OpenRecordset("Select * from Fleteros where CodFlet = " & rsEncabLiq!CodFlet & "", 2)
'completa resumen
Liquidaciones.Text1(28) = Lista.Tag
Liquidaciones.Text1(1) = rsFleteros!DescFlet
Liquidaciones.Text1(2) = rsEncabLiq!Obs
TViajesNeto = rsEncabLiq!TNetoViajes
Liquidaciones.Text1(3) = rsEncabLiq!TNetoViajes
TIVAViajes = rsEncabLiq!TIVAViajes
Liquidaciones.Text1(4) = rsEncabLiq!TIVAViajes
TViajes = rsEncabLiq!TViajes
Liquidaciones.Text1(5) = rsEncabLiq!TViajes
Liquidaciones.Text1(6) = rsFleteros!Comision
TNetoComis = rsEncabLiq!TNetoComis
Liquidaciones.Text1(7) = rsEncabLiq!TNetoComis
TIVAComis = rsEncabLiq!TIVAComis
Liquidaciones.Text1(8) = TIVAComis
TComis = rsEncabLiq!TComis
Liquidaciones.Text1(9) = TComis
Liquidaciones.Text1(10) = TViajes
Liquidaciones.Text1(11) = TComis
Liquidaciones.Text1(12) = rsEncabLiq!TDescuentos
TDescuentos = rsEncabLiq!TDescuentos
TPagar = rsEncabLiq!TPagar
Liquidaciones.Text1(13) = TPagar
'completa viajes
Set rsLiqDetViajes = db.OpenRecordset("Select * from LiqDetViajes Where NroLiq = " & rsEncabLiq!NroLiq & "")
Do While Not rsLiqDetViajes.EOF
    Set LDetViajes = Liquidaciones.ListaViajes.ListItems.Add(, , rsLiqDetViajes!Fecha)
    LDetViajes.Tag = rsLiqDetViajes!Fecha
    LDetViajes.SubItems(1) = rsLiqDetViajes!NroRemito
    LDetViajes.SubItems(2) = rsLiqDetViajes!DescEmpresa
    LDetViajes.SubItems(3) = rsLiqDetViajes!DescChofer
    LDetViajes.SubItems(4) = rsLiqDetViajes!MErcaderia
    LDetViajes.SubItems(5) = rsLiqDetViajes!Procedencia
    LDetViajes.SubItems(6) = rsLiqDetViajes!Destino
    LDetViajes.SubItems(7) = rsLiqDetViajes!Kilos
    LDetViajes.SubItems(8) = rsLiqDetViajes!Tarifa
    LDetViajes.SubItems(9) = rsLiqDetViajes!SubTotal
    LDetViajes.SubItems(10) = rsLiqDetViajes!CodEmpresa
    LDetViajes.SubItems(11) = rsLiqDetViajes!CodChofer
    LDetViajes.SubItems(12) = rsLiqDetViajes!Provincia
    LDetViajes.SubItems(13) = rsLiqDetViajes!NroViaje
    LDetViajes.SubItems(14) = rsLiqDetViajes!Facturado
    rsLiqDetViajes.MoveNext
Loop
'carga detalle de descuentos
Set rsLiqDetDesc = db.OpenRecordset("Select * from LiqDetDescuentos Where NroLiq = " & rsEncabLiq!NroLiq & "")
Do While Not rsLiqDetDesc.EOF
    Set LDetDesc = Liquidaciones.ListDescuentos.ListItems.Add(, , rsLiqDetDesc!NroRemito)
    LDetDesc.Tag = rsLiqDetDesc!NroRemito
    LDetDesc.SubItems(1) = rsLiqDetDesc!Efvo
    LDetDesc.SubItems(2) = rsLiqDetDesc.Fields("Gas-Oil")
    LDetDesc.SubItems(3) = rsLiqDetDesc!Faltante
    rsLiqDetDesc.MoveNext
Loop
Liquidaciones.DescPendientes.ListItems.Clear
Set rsGasOilFleteros = db.OpenRecordset("SELECT * FROM GasOilFleteros WHERE CodFlet = " & Text1(0) & "")
Do While Not rsGasOilFleteros.EOF
    If rsGasOilFleteros!CodFlet = Text1(0) And rsGasOilFleteros!Descontada = "NO" Then
        Set LDescGO = Liquidaciones.DescPendientes.ListItems.Add(, , rsGasOilFleteros!Fecha)
        LDescGO.Tag = rsGasOilFleteros.Fields("Fecha")
        LDescGO.SubItems(1) = rsGasOilFleteros.Fields("PtoVta")
        LDescGO.SubItems(2) = rsGasOilFleteros.Fields("NroFact")
        LDescGO.SubItems(3) = FormatNumber(rsGasOilFleteros.Fields("Importe"))
    End If
        rsGasOilFleteros.MoveNext
Loop
Set rsGasOilFleteros = Nothing
Set rsEncabLiq = Nothing
Set rsFleteros = Nothing
Set rsEncabLiq = Nothing
Set rsLiqDetViajes = Nothing
Set rsLiqDetDesc = Nothing
Unload Me
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
Case 0:
    If Not Text1(0) = "" Then
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros where CodFlet = " & Text1(0) & "", 2)
    If Not rsFleteros.EOF And Not rsFleteros.BOF Then
        Text1(1) = rsFleteros!DescFlet
        Set rsEncabLiq = db.OpenRecordset("Select * from EncabLiquidacion where CodFLet = " & Text1(0) & "", 2)
        ListLiquidaciones.ListItems.Clear
        Do While Not rsEncabLiq.EOF
            Set Lista = ListLiquidaciones.ListItems.Add(, , rsEncabLiq!NroLiq)
            Lista.Tag = rsEncabLiq!NroLiq
            Lista.SubItems(1) = rsEncabLiq!Fecha
            Lista.SubItems(2) = rsEncabLiq!TViajes
            Lista.SubItems(3) = rsEncabLiq!TComis
            Lista.SubItems(4) = rsEncabLiq!TDescuentos
            Lista.SubItems(5) = rsEncabLiq!TPagar
            rsEncabLiq.MoveNext
        Loop
        Set rsEncabLiq = Nothing
        Set rsFleteros = Nothing
    End If
    End If
End Select
End Sub
