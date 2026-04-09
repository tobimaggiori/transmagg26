VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form BuscEmpresas 
   BackColor       =   &H80000007&
   Caption         =   "Buscar Empresas"
   ClientHeight    =   5505
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   6105
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5505
   ScaleWidth      =   6105
   Begin VB.TextBox Text1 
      Height          =   285
      Left            =   960
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   4920
      Width           =   4815
   End
   Begin VB.TextBox Viene 
      Height          =   285
      Left            =   120
      TabIndex        =   1
      Text            =   "Text2"
      Top             =   5160
      Visible         =   0   'False
      Width           =   615
   End
   Begin MSComctlLib.ListView ListEmpresas 
      Height          =   4695
      Left            =   240
      TabIndex        =   0
      Top             =   120
      Width           =   5535
      _ExtentX        =   9763
      _ExtentY        =   8281
      View            =   3
      LabelWrap       =   0   'False
      HideSelection   =   0   'False
      FullRowSelect   =   -1  'True
      _Version        =   393217
      ForeColor       =   -2147483640
      BackColor       =   -2147483643
      BorderStyle     =   1
      Appearance      =   1
      NumItems        =   2
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Código"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "Descripción"
         Object.Width           =   7056
      EndProperty
   End
   Begin VB.Label Label8 
      BackColor       =   &H00000000&
      Caption         =   "Buscar"
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
      Left            =   240
      TabIndex        =   3
      Top             =   4920
      Width           =   855
   End
End
Attribute VB_Name = "BuscEmpresas"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Form_Initialize()
Set rsEmpresas = Nothing
End Sub

Private Sub Form_Load()
Set rsEmpresas = db.OpenRecordset("Empresas")
ListEmpresas.ListItems.Clear
Do While Not rsEmpresas.EOF
    Set Lista = ListEmpresas.ListItems.Add(, , rsEmpresas!CodEmpresas)
        Lista.Tag = rsEmpresas!CodEmpresas
        Lista.SubItems(1) = rsEmpresas!DescEmpresas
    rsEmpresas.MoveNext
Loop
Set rsEmpresas = Nothing
Text1.Text = ""
End Sub

Private Sub ListEmpresas_DblClick()
Dim VCodEmpresa As Long
If Viene = "Liq" Then
    Set Lista = ListEmpresas.ListItems.Item(ListEmpresas.SelectedItem.Index)
    VCodEmpresa = Lista.Tag
    Set rsEmpresas = db.OpenRecordset("Select * from Empresas Where CodEmpresas = " & VCodEmpresa & "", 2)
    If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
        LiqProducto.Text1(0) = rsEmpresas!CodEmpresas
        LiqProducto.Text1(1) = rsEmpresas!DescEmpresas
    End If
    Set rsEmpresas = Nothing
    Unload Me
    LiqProducto.Text1(2).SetFocus
End If
If Viene = "LiqProd" Then
    Set Lista = ListEmpresas.ListItems.Item(ListEmpresas.SelectedItem.Index)
    VCodEmpresa = Lista.Tag
    Set rsEmpresas = db.OpenRecordset("Select * from Empresas Where CodEmpresas = " & VCodEmpresa & "", 2)
    If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
        LiqProducto.Text1(4) = rsEmpresas!CodEmpresas
        LiqProducto.Text1(5) = rsEmpresas!DescEmpresas
    End If
    Set rsEmpresas = Nothing
    Unload Me
    LiqProducto.Text1(6).SetFocus
    Exit Sub
End If

If Viene = "FactViajes" Then
    Set Lista = ListEmpresas.ListItems.Item(ListEmpresas.SelectedItem.Index)
    VCodEmpresa = Lista.Tag
    Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & VCodEmpresa & "")
    If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
        FacturarViajes.Text1(1) = rsEmpresas!DescEmpresas
        FacturarViajes.Text1(0) = rsEmpresas!CodEmpresas
        Set rsLiqDetViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE CodEmpresa = " & VCodEmpresa & " AND Facturado = 'NO' ORDER BY Fecha")
        FacturarViajes.ListaViajes.ListItems.Clear
        Do While Not rsLiqDetViajes.EOF
        Set Lista = FacturarViajes.ListaViajes.ListItems.Add(, , rsLiqDetViajes!Fecha)
            Lista.Tag = rsLiqDetViajes!Fecha
            Lista.SubItems(1) = rsLiqDetViajes!NroRemito
            Lista.SubItems(2) = rsLiqDetViajes!DescChofer
            Lista.SubItems(3) = rsLiqDetViajes!Mercaderia
            Lista.SubItems(4) = rsLiqDetViajes!Procedencia
            Lista.SubItems(5) = rsLiqDetViajes!Destino
            Lista.SubItems(6) = FormatNumber(rsLiqDetViajes!kilos)
            Lista.SubItems(7) = FormatNumber(rsLiqDetViajes!tarifa)
            Lista.SubItems(8) = FormatNumber(rsLiqDetViajes!Subtotal)
            Lista.SubItems(9) = rsLiqDetViajes!CodEmpresa
            Lista.SubItems(10) = rsLiqDetViajes!CodChofer
            rsLiqDetViajes.MoveNext
        Loop
        Set rsLiqDetViajes = Nothing
    End If
    Set rsEmpresas = Nothing
    Unload Me
    FacturarViajes.Text1(2).SetFocus
End If
If Viene = "CS_UNO" Then
    Set Lista = ListaEmpresas.ListItems.Item(ListaEmpresas.SelectedItem.Index)
    ConsSaldos.Text1(0) = Lista.Tag
    ConsSaldos.Label1(0) = Lista.SubItems(1)
End If
If Viene = "CS_RDESDE" Then
    Set Lista = ListaEmpresas.ListItems.Item(ListaEmpresas.SelectedItem.Index)
    ConsSaldos.Text1(1) = Lista.Tag
    ConsSaldos.Label1(1) = Lista.SubItems(1)
End If
If Viene = "CS_RHASTA" Then
    Set Lista = ListaEmpresas.ListItems.Item(ListaEmpresas.SelectedItem.Index)
    ConsSaldos.Text1(2) = Lista.Tag
    ConsSaldos.Label1(2) = Lista.SubItems(1)
End If
If Viene = "RecCob" Then
    Set Lista = ListEmpresas.ListItems.Item(ListEmpresas.SelectedItem.Index)
    RecCob.Text1 = Lista.Tag
    RecCob.Label1 = Lista.SubItems(1)
    RecCob.Fecha.SetFocus
    Unload Me
End If
If Viene = "FactCta" Then
    Set Lista = ListEmpresas.ListItems.Item(ListEmpresas.SelectedItem.Index)
    FactxCta.Text1(2) = Lista.Tag
    FactxCta.Text1(3) = Lista.SubItems(1)
    Unload Me
End If
End Sub

Private Sub Text1_Change()
Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE DescEmpresas LIKE '*" & Text1 & "*' ORDER BY DescEmpresas")
ListEmpresas.ListItems.Clear
Do While Not rsEmpresas.EOF
    Set Lista = ListEmpresas.ListItems.Add(, , rsEmpresas!CodEmpresas)
        Lista.Tag = rsEmpresas!CodEmpresas
        Lista.SubItems(1) = rsEmpresas!DescEmpresas
    rsEmpresas.MoveNext
Loop
Set rsEmpresas = Nothing
End Sub
