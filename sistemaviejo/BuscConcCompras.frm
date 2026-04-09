VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form BuscConcCompras 
   BackColor       =   &H80000007&
   Caption         =   "Consulta de Conceptos de Compras"
   ClientHeight    =   5505
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   5985
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5505
   ScaleWidth      =   5985
   Begin VB.TextBox Viene 
      Height          =   285
      Index           =   1
      Left            =   840
      TabIndex        =   4
      Text            =   "Text2"
      Top             =   5160
      Visible         =   0   'False
      Width           =   615
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Left            =   840
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   4800
      Width           =   4815
   End
   Begin VB.TextBox Viene 
      Height          =   285
      Index           =   0
      Left            =   0
      TabIndex        =   0
      Text            =   "Text2"
      Top             =   5040
      Visible         =   0   'False
      Width           =   615
   End
   Begin MSComctlLib.ListView ListConcepto 
      Height          =   4695
      Left            =   120
      TabIndex        =   2
      Top             =   0
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
         Text            =   "Concepto Compras"
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
      Left            =   120
      TabIndex        =   3
      Top             =   4800
      Width           =   855
   End
End
Attribute VB_Name = "BuscConcCompras"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Form_Initialize()
Set rsConceptoCompras = Nothing
End Sub

Private Sub Form_Load()
Set rsConceptoCompras = db.OpenRecordset("Select * From ConceptoCompras order by DescConcepto")
ListConcepto.ListItems.Clear
Do While Not rsConceptoCompras.EOF
    Set Lista = ListConcepto.ListItems.Add(, , rsConceptoCompras!CodConcepto)
        Lista.Tag = rsConceptoCompras!CodConcepto
        Lista.SubItems(1) = rsConceptoCompras!descconcepto
    rsConceptoCompras.MoveNext
Loop
Set rsConceptoCompras = Nothing
Text1.Text = ""
End Sub

Private Sub ListConcepto_DblClick()
If Viene(0) = "FactProv" Then
    Set Lista = ListConcepto.ListItems.Item(ListConcepto.SelectedItem.Index)
        FactProv.Text1(Viene(1)) = Lista.Tag
        FactProv.Text1(Viene(1) + 1) = Lista.SubItems(1)
    Unload Me
End If
End Sub

Private Sub Text1_Change()
Dim VCodflet As Long
Set rsConceptoCompras = db.OpenRecordset("SELECT * FROM ConceptoCompras WHERE DescConcepto LIKE '*" & Text1 & "*' ORDER BY DescConcepto")
ListConcepto.ListItems.Clear
Do While Not rsConceptoCompras.EOF
    Set Lista = ListConcepto.ListItems.Add(, , rsConceptoCompras!CodConcepto)
        Lista.Tag = rsConceptoCompras!CodConcepto
        Lista.SubItems(1) = rsConceptoCompras!descconcepto
    rsConceptoCompras.MoveNext
Loop
Set rsConceptoCompras = Nothing
End Sub


