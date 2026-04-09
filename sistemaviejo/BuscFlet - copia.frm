VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form BuscFlet 
   Caption         =   "Buscar Fleteros"
   ClientHeight    =   5505
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   6105
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5505
   ScaleWidth      =   6105
   Begin VB.TextBox Viene 
      Height          =   285
      Left            =   120
      TabIndex        =   3
      Text            =   "Text2"
      Top             =   5160
      Visible         =   0   'False
      Width           =   615
   End
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
      Height          =   285
      Left            =   960
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   4920
      Width           =   4815
   End
   Begin MSComctlLib.ListView ListFlet 
      Height          =   4695
      Left            =   360
      TabIndex        =   1
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
         Text            =   "Codigo"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "Descripción"
         Object.Width           =   7056
      EndProperty
   End
   Begin VB.Label Label8 
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
      ForeColor       =   &H00C00000&
      Height          =   255
      Left            =   240
      TabIndex        =   2
      Top             =   4920
      Width           =   855
   End
End
Attribute VB_Name = "BuscFlet"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Form_Initialize()
Set rsFleteros = Nothing
End Sub

Private Sub Form_Load()
Set rsFleteros = db.OpenRecordset("SELECT * FROM Fleteros")
ListFlet.ListItems.Clear
Do While Not rsFleteros.EOF
    Set Lista = ListFlet.ListItems.Add(, , rsFleteros!CodFlet)
        Lista.Tag = rsFleteros!CodFlet
        Lista.SubItems(1) = rsFleteros!DescFlet
    rsFleteros.MoveNext
Loop
Set rsFleteros = Nothing
Text1.Text = ""
End Sub

Private Sub ListFlet_DblClick()
Dim VCodflet As Long
If Viene = "ConsLiq" Then
    Set Lista = ListFlet.ListItems.Item(ListFlet.SelectedItem.Index)
    VCodflet = Lista.Tag
    If Not IsNull(VCodflet) Then
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros where CodFlet = " & VCodflet & "", 2)
        If Not rsFleteros.EOF And Not rsFleteros.BOF Then
            ConsLiquidaciones.Text1(0) = VCodflet
            ConsLiquidaciones.Text1(1) = rsFleteros!DescFlet
            Set rsEncabLiq = db.OpenRecordset("Select * from EncabLiquidacion where CodFLet = " & VCodflet & " and Pagada = 'NO'", 2)
            ConsLiquidaciones.ListLiquidaciones.ListItems.Clear
            Do While Not rsEncabLiq.EOF
                Set Lista = ConsLiquidaciones.ListLiquidaciones.ListItems.Add(, , rsEncabLiq!NroLiq)
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
    Unload Me
    Exit Sub
End If
If Viene = "Liq" Then
    Set Lista = ListFlet.ListItems.Item(ListFlet.SelectedItem.Index)
    VCodflet = Lista.Tag
    If Not IsNull(VCodflet) Then
        Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & VCodflet & "", 2)
            If Not rsFleteros.EOF And Not rsFleteros.BOF Then
                Liquidaciones.Text1(0) = rsFleteros!CodFlet
                Liquidaciones.Text1(1) = rsFleteros!DescFlet
                Liquidaciones.Text1(6) = FormatNumber(rsFleteros!Comision)
                
            End If
            Set rsFleteros = Nothing
    End If
    Unload Me
    Liquidaciones.Text1(2).SetFocus
    Exit Sub
End If
If Viene = "RegFactProv" Then
    Set Lista = ListFlet.ListItems.Item(ListFlet.SelectedItem.Index)
    VCodflet = Lista.Tag
    If Not IsNull(VCodflet) Then
        With RegFactProv
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & VCodflet & "")
            If Not rsFleteros.EOF And Not rsFleteros.BOF Then
                .Text1(2) = VCodflet
                .Text1(3) = rsFleteros!DescFlet
                Set rsEncabLiq = db.OpenRecordset("Select * From EncabLiquidacion Where CodFlet = " & VCodflet & " And Pagada = 'NO'")
                .LiqPend.ListItems.Clear
                If Not rsEncabLiq.EOF And Not rsEncabLiq.BOF Then
                    Do While Not rsEncabLiq.EOF
                        Set Lista = .LiqPend.ListItems.Add(, , rsEncabLiq!NroLiq)
                            Lista.Tag = rsEncabLiq!NroLiq
                            Lista.SubItems(1) = rsEncabLiq!Fecha
                            Lista.SubItems(2) = FormatNumber(rsEncabLiq!TViajes)
                            Lista.SubItems(3) = FormatNumber(rsEncabLiq!TDescuentos)
                            Lista.SubItems(4) = FormatNumber(rsEncabLiq!TComis)
                            Lista.SubItems(5) = FormatNumber(rsEncabLiq!TPagar)
                            rsEncabLiq.MoveNext
                    Loop
                End If
                Set rsEncabLiq = Nothing
                .Text1(4).SetFocus
            End If
            Set rsFleteros = Nothing
        End With
    End If
    Unload Me
    Exit Sub
End If
If Viene = "LP" Then
    Set Lista = ListFlet.ListItems.Item(ListFlet.SelectedItem.Index)
    LiquidoProducto.Text1(0) = Lista.Tag
    Set rsFleteros = db.OpenRecordset("Select * from Fleteros where CodFlet = " & Lista.Tag & "")
    LiquidoProducto.Label1(6) = rsFleteros!DescFlet
    'busca facturas pendientes
    Set rsCtaCteProv = db.OpenRecordset("Select * from CtaCteProv Where CodProv = " & Lista.Tag & " and SaldoComp > 0")
    LiquidoProducto.FacturasPend.ListItems.Clear
    Dim ListaLP As ListItem
    Do While Not rsCtaCteProv.EOF
        Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM EncabFactProv WHERE CodProv = " & Lista.Tag & " AND NroFact = " & rsCtaCteProv!NroComp & "")
        Set ListaLP = LiquidoProducto.FacturasPend.ListItems.Add(, , rsEncabFactProv!NroFact)
        ListaLP.Tag = rsEncabFactProv!NroFact
        ListaLP.SubItems(1) = rsEncabFactProv!Fecha
        ListaLP.SubItems(2) = FormatNumber(rsEncabFactProv!TotalNeto)
        TNFactPend = TNFactPend + rsEncabFactProv!TotalNeto
        ListaLP.SubItems(3) = FormatNumber(rsEncabFactProv!IVA)
        TIVAFactPend = TIVAFactPend + rsEncabFactProv!IVA
        ListaLP.SubItems(4) = FormatNumber(rsEncabFactProv!Total)
        TGFactPend = TGFactPend + rsEncabFactProv!Total
        rsCtaCteProv.MoveNext
    Loop
    LiquidoProducto.Label1(0) = FormatNumber(TGFactPend)
    LiquidoProducto.Label1(1) = FormatNumber(TIVAFactPend)
    LiquidoProducto.Label1(2) = FormatNumber(TNFactPend)
    Set rsFleteros = Nothing
    Set rsCtaCteProv = Nothing
    Set rsEncabFactProv = Nothing
    Unload Me
    Exit Sub
End If
If Viene = "CtaCte" Then
    Set Lista = ListFlet.ListItems.Item(ListFlet.SelectedItem.Index)
    ConsCtaCteFlet.Text1 = Lista.Tag
    ConsCtaCteFlet.Label2 = Lista.SubItems(1)
    ConsCtaCteFlet.FDesde.SetFocus
    Unload Me
    Exit Sub
End If
If Viene = "FactProv" Then
    Set Lista = ListFlet.ListItems.Item(ListFlet.SelectedItem.Index)
    FactProv.Text1(55) = Lista.Tag
    FactProv.Text1(56) = Lista.SubItems(1)
    FactProv.Text1(4).SetFocus
    Unload Me
    Exit Sub
End If
If Viene = "OrdenPago" Then
    Set Lista = ListFlet.ListItems.Item(ListFlet.SelectedItem.Index)
    OrdenPago.Text1(1) = Lista.Tag
    OrdenPago.Text1(2) = Lista.SubItems(1)
    Unload Me
End If
End Sub

Private Sub Text1_Change()
Set rsFleteros = db.OpenRecordset("SELECT * FROM Fleteros WHERE DescFlet LIKE '*" & Text1 & "*' ORDER BY DescFlet")
ListFlet.ListItems.Clear
Do While Not rsFleteros.EOF
    Set Lista = ListFlet.ListItems.Add(, , rsFleteros!CodFlet)
        Lista.Tag = rsFleteros!CodFlet
        Lista.SubItems(1) = rsFleteros!DescFlet
    rsFleteros.MoveNext
Loop
Set rsFleteros = Nothing
End Sub
