VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form ConsChequesTer 
   Caption         =   "Consulta Estado Cheques de Tercero"
   ClientHeight    =   5805
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   8745
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5805
   ScaleWidth      =   8745
   Begin VB.CommandButton Imprimir 
      Caption         =   "Imprimir"
      Height          =   375
      Left            =   6240
      TabIndex        =   6
      Top             =   240
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
      Height          =   285
      Left            =   3960
      TabIndex        =   5
      Text            =   "Text1"
      Top             =   5160
      Width           =   1335
   End
   Begin VB.CommandButton Consultar 
      Caption         =   "Consultar"
      Height          =   375
      Left            =   4680
      TabIndex        =   3
      Top             =   240
      Width           =   1335
   End
   Begin MSComctlLib.ListView ListChTerE 
      Height          =   4215
      Left            =   120
      TabIndex        =   2
      Top             =   840
      Width           =   8500
      _ExtentX        =   15002
      _ExtentY        =   7435
      View            =   3
      LabelWrap       =   0   'False
      HideSelection   =   0   'False
      FullRowSelect   =   -1  'True
      GridLines       =   -1  'True
      _Version        =   393217
      ForeColor       =   -2147483640
      BackColor       =   -2147483643
      BorderStyle     =   1
      Appearance      =   1
      NumItems        =   6
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Banco"
         Object.Width           =   1764
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "Numero"
         Object.Width           =   1764
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "F. Vto"
         Object.Width           =   1764
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Importe"
         Object.Width           =   1764
      EndProperty
      BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   4
         Text            =   "Recibido de:"
         Object.Width           =   3528
      EndProperty
      BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   5
         Text            =   "Entregado a:"
         Object.Width           =   3528
      EndProperty
   End
   Begin VB.ComboBox Estado 
      Height          =   315
      Left            =   1080
      TabIndex        =   0
      Top             =   240
      Width           =   3135
   End
   Begin VB.Label Label1 
      Caption         =   "Total"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FF0000&
      Height          =   255
      Index           =   0
      Left            =   120
      TabIndex        =   4
      Top             =   5160
      Width           =   3495
   End
   Begin VB.Label Label1 
      Caption         =   "Estado:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FF0000&
      Height          =   255
      Index           =   5
      Left            =   120
      TabIndex        =   1
      Top             =   240
      Width           =   975
   End
End
Attribute VB_Name = "ConsChequesTer"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private TCHTerEstado As Double, LChTerEstado As ListItem

Private Sub Consultar_Click()
Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where Estado = '" & Estado.Text & "' Order By FechaVto")
TCHTerEstado = 0
ListChTerE.ListItems.Clear
Do While Not rsChTer.EOF
    Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & rsChTer!CodBanco & "")
    Set LChTerEstado = ListChTerE.ListItems.Add(, , rsBcos!DescBco)
       
        LChTerEstado.Tag = rsBcos!DescBco
        Set rsBcos = Nothing
        LChTerEstado.SubItems(1) = rsChTer!NroCH
        LChTerEstado.SubItems(2) = rsChTer!FechaVto
        LChTerEstado.SubItems(3) = FormatCurrency(rsChTer!Importe)
        If Not rsChTer!Entregado = "" Then
            LChTerEstado.SubItems(4) = rsChTer!Entregado
        End If
        If Not rsChTer!Dado = "" Then
            LChTerEstado.SubItems(5) = rsChTer!Dado
        End If
        TCHTerEstado = TCHTerEstado + rsChTer!Importe
        rsChTer.MoveNext
Loop
Text1 = FormatCurrency(TCHTerEstado)
End Sub

Private Sub Form_Load()
Estado.Clear
Estado.AddItem ("En Cartera")
Estado.AddItem ("Liquido Producto")
Estado.AddItem ("Orden de Pago")
Estado.AddItem ("Otro")
Estado.AddItem ("Depositado Cta2552/08")
Estado.ListIndex = 0
End Sub

Private Sub Imprimir_Click()
Printer.ScaleMode = 6
Printer.CurrentX = 80: Printer.CurrentY = 10
Printer.FontSize = 10: Printer.FontBold = True
Printer.Print "Listado de Cheques"
Printer.FontSize = 8: Printer.FontBold = False
Printer.Line (70, 15)-(120, 10)
Printer.CurrentX = 15: Printer.CurrentY = 15
Printer.Print "Estado:      " & Estado.Text
Printer.CurrentX = 10: Printer.CurrentY = 20
Printer.Print "Banco"
Printer.CurrentX = 40: Printer.CurrentY = 20
Printer.Print "Número"
Printer.CurrentX = 70: Printer.CurrentY = 20
Printer.Print "F. Vto"
Printer.CurrentX = 90: Printer.CurrentY = 20
Printer.Print "Importe"
Printer.CurrentX = 110: Printer.CurrentY = 20
Printer.Print "Recibido de:"
Printer.CurrentY = 150: Printer.CurrentY = 20
Printer.Print "Entregado a:"
I = 0
LINEAY = 25
For I = I + 1 To ListChTerE.ListItems.Count
    If LINEAY > 270 Then
        Printer.NewPage
        Printer.CurrentX = 80: Printer.CurrentY = 10
        Printer.Print "Listado de Cheques"
        Printer.Line (75, 10)-(120, 10)
        Printer.CurrentX = 15: Printer.CurrentY = 15
        Printer.Print "Estado:      " & Estado.Text
        Printer.CurrentX = 10: Printer.CurrentY = 20
        Printer.Print "Banco"
        Printer.CurrentX = 40: Printer.CurrentY = 20
        Printer.Print "Número"
        Printer.CurrentX = 70: Printer.CurrentY = 20
        Printer.Print "F. Vto"
        Printer.CurrentX = 90: Printer.CurrentY = 20
        Printer.Print "Importe"
        Printer.CurrentX = 110: Printer.CurrentY = 20
        Printer.Print "Recibido de:"
        Printer.CurrentY = 150: Printer.CurrentY = 20
        Printer.Print "Entregado a:"
        LINEAY = 25
    End If
    Set LChTerEstado = ListChTerE.ListItems.Item(I)
    Printer.CurrentX = 10: Printer.CurrentY = LINEAY
    Printer.Print LChTerEstado.Tag
    Printer.CurrentX = 40: Printer.CurrentY = LINEAY
    Printer.Print LChTerEstado.SubItems(1)
    Printer.CurrentX = 70: Printer.CurrentY = LINEAY
    Printer.Print LChTerEstado.SubItems(2)
    Printer.CurrentX = 90: Printer.CurrentY = LINEAY
    Printer.Print LChTerEstado.SubItems(3)
    Printer.CurrentX = 110: Printer.CurrentY = LINEAY
    Printer.Print LChTerEstado.SubItems(4)
    Printer.CurrentY = 150: Printer.CurrentY = LINEAY
    Printer.Print LChTerEstado.SubItems(5)
    LINEAY = LINEAY + 5
Next
Printer.CurrentX = 30: Printer.CurrentY = LINEAY + 5
Printer.Print "Total Cheques:   " & Text1
Printer.EndDoc
End Sub
